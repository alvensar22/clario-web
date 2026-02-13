'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useNotifications } from './notification-provider';
import type { ApiNotificationAggregated } from '@/lib/api/types';
import { NotificationRow } from './notification-row';
import { NotificationBell } from './notification-bell';

const DROPDOWN_LIMIT = 20;

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

export function NotificationDropdown({ isOpen, onClose, anchorRef }: NotificationDropdownProps) {
  const [items, setItems] = useState<ApiNotificationAggregated[]>([]);
  const [loading, setLoading] = useState(false);
  const notificationsCtx = useNotifications();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getNotifications(DROPDOWN_LIMIT, 0);
    setLoading(false);
    if (data?.notifications) {
      setItems(data.notifications);
    }
    notificationsCtx?.refreshUnreadCount();
  }, [notificationsCtx]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const markRead = useCallback((ids: string[]) => {
    api.markNotificationRead(ids);
    setItems((prev) =>
      prev.map((g) =>
        g.ids.some((id) => ids.includes(id))
          ? { ...g, read_at: new Date().toISOString() }
          : g
      )
    );
    notificationsCtx?.refreshUnreadCount();
  }, [notificationsCtx]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
      <div className="border-b border-neutral-800/80 px-4 py-3">
        <h2 className="text-base font-semibold text-white">Notifications</h2>
      </div>
      <div className="max-h-[320px] overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            No notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-800/80">
            {items.map((item) => (
              <NotificationRow
                key={item.ids[0] ?? item.created_at}
                item={item}
                onMarkRead={markRead}
                onNavigate={onClose}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-neutral-800/80 p-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block w-full rounded-lg py-2.5 text-center text-sm font-medium text-blue-400 transition-colors hover:bg-neutral-800/80 hover:text-blue-300"
        >
          See all previous notifications
        </Link>
      </div>
    </div>
  );
}

interface NotificationBellWithDropdownProps {
  className?: string;
}

/** Bell icon that opens notification dropdown on click. */
export function NotificationBellWithDropdown({ className }: NotificationBellWithDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-neutral-800/80"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <NotificationBell className={className} />
      </button>
      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={anchorRef}
      />
    </div>
  );
}
