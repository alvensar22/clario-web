'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import type { ApiNotification } from '@/lib/api/types';

interface ToastState {
  message: string;
  notification?: ApiNotification;
}

interface NotificationContextValue {
  unreadCount: number | null;
  /** Call when a new notification should be prepended to the list */
  onNewNotification: (cb: (n: ApiNotification) => void) => () => void;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return ctx;
}

const TOAST_DURATION_MS = 5000;

function formatToastMessage(notification: ApiNotification): string {
  const username = notification.actor?.username ?? 'Someone';
  switch (notification.type) {
    case 'like':
      return `@${username} liked your post`;
    case 'comment':
      return `@${username} commented on your post`;
    case 'follow':
      return `@${username} started following you`;
    default:
      return 'New notification';
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const listenersRef = useRef<Set<(n: ApiNotification) => void>>(new Set());
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUnreadCount = useCallback(() => {
    api.getNotificationUnreadCount().then(({ data }) => {
      setUnreadCount(data?.count ?? 0);
    });
  }, []);

  const onNewNotification = useCallback((cb: (n: ApiNotification) => void) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const showToast = useCallback((notification: ApiNotification) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      message: formatToastMessage(notification),
      notification,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const notifyListeners = useCallback((n: ApiNotification) => {
    listenersRef.current.forEach((cb) => cb(n));
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      if (!userId) return;

      // Ensure Realtime uses the current session for auth (required for RLS)
      try {
        await supabase.realtime.setAuth(session.access_token);
      } catch {
        // Continue without setAuth; Realtime may still work with service role
      }

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              user_id: string;
              actor_id: string;
              type: string;
              post_id: string | null;
              comment_id: string | null;
              read_at: string | null;
              created_at: string;
            };

            const { data: actor } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', row.actor_id)
              .maybeSingle();

            const notification: ApiNotification = {
              ...row,
              actor: actor ?? { username: null, avatar_url: null },
            };

            setUnreadCount((c) => (c ?? 0) + 1);
            notifyListeners(notification);
            showToast(notification);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Notifications] Realtime subscription failed:', status);
          }
        });
    };

    setupRealtime();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setupRealtime();
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [notifyListeners, showToast]);

  // Polling fallback: refresh unread count every 15s when Realtime may not be working
  useEffect(() => {
    const interval = setInterval(refreshUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        onNewNotification,
        refreshUnreadCount,
      }}
    >
      {children}
      {toast && (
        <div
          className="fixed bottom-4 left-4 z-[100] max-w-sm rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl"
          style={{ animation: 'toastSlideIn 0.3s ease-out' }}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-white">{toast.message}</p>
          {toast.notification?.post_id && (
            <Link
              href={`/post/${toast.notification.post_id}`}
              className="mt-1 block text-xs text-blue-400 hover:underline"
            >
              View post →
            </Link>
          )}
          {toast.notification?.type === 'follow' && toast.notification.actor?.username && (
            <Link
              href={`/profile/${toast.notification.actor.username}`}
              className="mt-1 block text-xs text-blue-400 hover:underline"
            >
              View profile →
            </Link>
          )}
        </div>
      )}
    </NotificationContext.Provider>
  );
}
