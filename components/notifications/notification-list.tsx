'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useNotifications } from './notification-provider';
import type { ApiNotificationAggregated, ApiNotification } from '@/lib/api/types';
import { NotificationRow } from './notification-row';

const PAGE_SIZE = 20;

interface NotificationListProps {
  initialItems: ApiNotificationAggregated[];
  initialHasMore: boolean;
}

export function NotificationList({ initialItems, initialHasMore }: NotificationListProps) {
  const [items, setItems] = useState<ApiNotificationAggregated[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const notificationsCtx = useNotifications();

  const hasUnread = items.some((g) => !g.read_at);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await api.getNotifications(PAGE_SIZE, 0);
    setRefreshing(false);
    if (data?.notifications) {
      const fetched = data.notifications;
      const fetchedIds = new Set(fetched.flatMap((g) => g.ids));
      setItems((prev) => {
        const rest = prev.filter((g) => !g.ids.some((id) => fetchedIds.has(id)));
        return [...fetched, ...rest];
      });
    }
    setHasMore(data?.hasMore ?? false);
    notificationsCtx?.refreshUnreadCount();
  }, [notificationsCtx]);

  useEffect(() => {
    if (!notificationsCtx) return;
    return notificationsCtx.onNewNotification((_n: ApiNotification) => {
      refresh();
    });
  }, [notificationsCtx, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

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

  const markAllRead = useCallback(() => {
    api.markNotificationRead();
    setItems((prev) =>
      prev.map((g) => ({ ...g, read_at: new Date().toISOString() }))
    );
    notificationsCtx?.refreshUnreadCount();
  }, [notificationsCtx]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setPullY(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    const y = e.touches[0].clientY - touchStartY.current;
    if (y > 0) setPullY(Math.min(y, 80));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullY >= 60) refresh();
    setPullY(0);
  }, [pullY, refresh]);

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
      {hasUnread && (
        <div className="border-b border-neutral-800/80 px-4 py-2">
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Mark all as read
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className="overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {pullY > 0 && (
          <div
            className="flex items-center justify-center py-3 text-sm text-neutral-500"
            style={{ height: pullY }}
          >
            {pullY >= 60 ? 'Release to refresh' : 'Pull down to refresh'}
          </div>
        )}
        <ul className="divide-y divide-neutral-800/80">
          {items.map((item) => (
            <NotificationRow key={item.ids[0] ?? item.created_at} item={item} onMarkRead={markRead} />
          ))}
        </ul>
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden>
            {(loading || refreshing) && (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
            )}
          </div>
        )}
      </div>
    </>
  );
}
