'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useNotifications } from './notification-provider';
import type { ApiNotificationAggregated, ApiNotification } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { RelativeTime } from '@/components/ui/relative-time';

const PAGE_SIZE = 20;

interface NotificationListProps {
  initialItems: ApiNotificationAggregated[];
  initialHasMore: boolean;
}

function formatActorsText(
  actors: { username: string | null }[],
  totalCount: number,
  verb: string
): string {
  const names = actors
    .filter((a) => a.username)
    .map((a) => `@${a.username}`)
    .slice(0, 2);
  if (totalCount === 1) {
    return `${names[0] ?? 'Someone'} ${verb}`;
  }
  if (totalCount === 2 && names.length >= 2) {
    return `${names[0]} and ${names[1]} ${verb}`;
  }
  if (totalCount === 2 && names.length === 1) {
    return `${names[0]} and 1 other ${verb}`;
  }
  if (names.length >= 2) {
    const others = totalCount - 2;
    return `${names[0]}, ${names[1]} and ${others} others ${verb}`;
  }
  if (names.length === 1) {
    const others = totalCount - 1;
    return `${names[0]} and ${others} others ${verb}`;
  }
  return `${totalCount} people ${verb}`;
}

export function NotificationList({ initialItems, initialHasMore }: NotificationListProps) {
  const [items, setItems] = useState<ApiNotificationAggregated[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const notificationsCtx = useNotifications();

  useEffect(() => {
    if (!notificationsCtx) return;
    return notificationsCtx.onNewNotification((_n: ApiNotification) => {
      api.getNotifications(PAGE_SIZE, 0).then(({ data }) => {
        if (!data?.notifications?.length) return;
        const fetched = data.notifications;
        const fetchedIds = new Set(fetched.flatMap((g) => g.ids));
        setItems((prev) => {
          const rest = prev.filter((g) => !g.ids.some((id) => fetchedIds.has(id)));
          return [...fetched, ...rest];
        });
      });
    });
  }, [notificationsCtx]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.getNotifications(PAGE_SIZE, 0);
      if (!data?.notifications?.length) return;
      const fetched = data.notifications;
      setItems((prev) => {
        const fetchedIds = new Set(fetched.flatMap((g) => g.ids));
        const rest = prev.filter((g) => !g.ids.some((id) => fetchedIds.has(id)));
        return [...fetched, ...rest];
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
          <NotificationRow key={item.ids[0] ?? item.created_at} item={item} onMarkRead={markRead} />
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
  item: ApiNotificationAggregated;
  onMarkRead: (ids: string[]) => void;
}) {
  const isUnread = !item.read_at;
  const firstActor = item.actors[0];
  const username = firstActor?.username ?? 'someone';

  const href =
    item.type === 'follow'
      ? `/profile/${username}`
      : item.post_id
        ? `/post/${item.post_id}`
        : '/notifications';

  const handleClick = () => {
    if (isUnread) onMarkRead(item.ids);
  };

  if (item.type === 'like') {
    const text = formatActorsText(item.actors, item.total_count, 'liked your post');
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
            <p className="text-sm text-white">{text}</p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'comment') {
    const text = formatActorsText(item.actors, item.total_count, 'commented on your post');
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
            <p className="text-sm text-white">{text}</p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'follow') {
    const text = formatActorsText(item.actors, item.total_count, 'started following you');
    return (
      <li>
        <Link
          href={href}
          onClick={handleClick}
          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40 ${isUnread ? 'bg-neutral-900/20' : ''}`}
        >
          <div className="flex shrink-0 -space-x-2">
            {item.actors.slice(0, 2).map((a) => (
              <Avatar
                key={a.id}
                src={a.avatar_url ?? undefined}
                fallback={a.username ?? '?'}
                size="md"
                className="ring-2 ring-black shrink-0"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">{text}</p>
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
