'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import type { ApiActivityItem } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { RelativeTime } from '@/components/ui/relative-time';

const PAGE_SIZE = 10;

function snippet(text: string, maxLen: number) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

interface ActivityListProps {
  initialItems: ApiActivityItem[];
  initialHasMore: boolean;
}

export function ActivityList({ initialItems, initialHasMore }: ActivityListProps) {
  const [items, setItems] = useState<ApiActivityItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const { data } = await api.getActivity(PAGE_SIZE, items.length);
    setLoading(false);
    if (data?.activity?.length) {
      setItems((prev) => [...prev, ...data.activity]);
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

  if (items.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-neutral-400">
        <p>No activity yet.</p>
        <p className="mt-1 text-sm">Your likes, comments, and follows will show up here.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-neutral-800/80">
        {items.map((item) => (
          <ActivityItemRow key={item.id} item={item} />
        ))}
      </ul>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex justify-center py-6"
          aria-hidden
        >
          {loading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          )}
        </div>
      )}
    </>
  );
}

function ActivityItemRow({ item }: { item: ApiActivityItem }) {
  if (item.type === 'like') {
    const username = item.post.author?.username ?? 'unknown';
    return (
      <li>
        <Link
          href={`/post/${item.post_id}`}
          className="flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              You liked a post by <span className="font-medium">@{username}</span>
            </p>
            <p className="mt-0.5 text-[13px] text-neutral-400">{snippet(item.post.content, 80)}</p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'comment') {
    const username = item.post.author?.username ?? 'unknown';
    return (
      <li>
        <Link
          href={`/post/${item.post_id}`}
          className="flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              You commented on a post by <span className="font-medium">@{username}</span>
            </p>
            <p className="mt-0.5 text-[13px] text-neutral-400">&quot;{snippet(item.comment_content, 60)}&quot;</p>
            <p className="mt-1 text-xs text-neutral-500">
              <RelativeTime isoDate={item.created_at} />
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (item.type === 'follow') {
    const username = item.user.username ?? 'unknown';
    return (
      <li>
        <Link
          href={`/profile/${username}`}
          className="flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40"
        >
          <Avatar
            src={item.user.avatar_url ?? undefined}
            fallback={username}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              You followed <span className="font-medium">@{username}</span>
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
