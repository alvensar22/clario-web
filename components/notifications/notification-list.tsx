'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useNotifications } from './notification-provider';
import type { ApiNotification } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { RelativeTime } from '@/components/ui/relative-time';

const PAGE_SIZE = 20;

interface NotificationListProps {
  initialItems: ApiNotification[];
  initialHasMore: boolean;
}

export function NotificationList({ initialItems, initialHasMore }: NotificationListProps) {
  const [items, setItems] = useState<ApiNotification[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const notificationsCtx = useNotifications();

  useEffect(() => {
    if (!notificationsCtx) return;
    return notificationsCtx.onNewNotification((n) => {
      setItems((prev) => {
        if (prev.some((i) => i.id === n.id)) return prev;
        return [n, ...prev];
      });
    });
  }, [notificationsCtx]);

  // Polling fallback: fetch latest every 15s to catch notifications when Realtime fails
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.getNotifications(10, 0);
      if (!data?.notifications?.length) return;
      const fetched = data.notifications;
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newOnes = fetched.filter((n) => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        return [...newOnes, ...prev];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const { data } = await api.getNotifications(PAGE_SIZE, items.length);
    setLoading(false);
    if (data?.notifications?.length) {
      setItems((prev) => [...prev, ...data.notifications]);
    }
    setHasMore(data?.hasMore ?? false);
  }, [items.length, hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  const markRead = useCallback((id: string) => {
    api.markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    notificationsCtx?.refreshUnreadCount();
  }, [notificationsCtx]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-neutral-400">
        <p>No notifications yet.</p>
        <p className="mt-1 text-sm">When someone likes, comments, or follows you, it will show here.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-neutral-800/80">
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} onMarkRead={markRead} />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden>
          {loading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          )}
        </div>
      )}
    </>
  );
}

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: ApiNotification;
  onMarkRead: (id: string) => void;
}) {
  const username = item.actor?.username ?? 'someone';
  const isUnread = !item.read_at;

  const href =
    item.type === 'follow'
      ? `/profile/${username}`
      : item.post_id
        ? `/post/${item.post_id}`
        : '/notifications';

  const handleClick = () => {
    if (isUnread) onMarkRead(item.id);
  };

  if (item.type === 'like') {
    return (
      <li>
        <Link
          href={href}
          onClick={handleClick}
          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40 ${isUnread ? 'bg-neutral-900/20' : ''}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              <span className="font-medium">@{username}</span> liked your post
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'comment') {
    return (
      <li>
        <Link
          href={href}
          onClick={handleClick}
          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40 ${isUnread ? 'bg-neutral-900/20' : ''}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              <span className="font-medium">@{username}</span> commented on your post
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'follow') {
    return (
      <li>
        <Link
          href={href}
          onClick={handleClick}
          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40 ${isUnread ? 'bg-neutral-900/20' : ''}`}
        >
          <Avatar
            src={item.actor?.avatar_url ?? undefined}
            fallback={username}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              <span className="font-medium">@{username}</span> started following you
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  return null;
}
