'use client';

import Link from 'next/link';
import type { ApiNotificationAggregated } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { RelativeTime } from '@/components/ui/relative-time';

export function formatActorsText(
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

export function TypeIcon({ type }: { type: string }) {
  const baseClass = 'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full';
  if (type === 'like') {
    return (
      <span className={`${baseClass} bg-red-500`}>
        <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </span>
    );
  }
  if (type === 'comment') {
    return (
      <span className={`${baseClass} bg-blue-500`}>
        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </span>
    );
  }
  return null;
}

interface NotificationRowProps {
  item: ApiNotificationAggregated;
  onMarkRead: (ids: string[]) => void;
  /** Called when user clicks to navigate (e.g. close dropdown) */
  onNavigate?: () => void;
}

export function NotificationRow({ item, onMarkRead, onNavigate }: NotificationRowProps) {
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
    onNavigate?.();
  };

  const rowClass = `flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-900/40 ${
    isUnread ? 'border-l-4 border-blue-500 bg-blue-950/20' : ''
  }`;

  if (item.type === 'like') {
    const text = formatActorsText(item.actors, item.total_count, 'liked your post');
    return (
      <li>
        <Link href={href} onClick={handleClick} className={rowClass}>
          <div className="relative shrink-0">
            <Avatar
              src={firstActor?.avatar_url ?? undefined}
              fallback={firstActor?.username ?? '?'}
              size="md"
            />
            <TypeIcon type="like" />
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

  if (item.type === 'comment') {
    const text = formatActorsText(item.actors, item.total_count, 'commented on your post');
    return (
      <li>
        <Link href={href} onClick={handleClick} className={rowClass}>
          <div className="relative shrink-0">
            <Avatar
              src={firstActor?.avatar_url ?? undefined}
              fallback={firstActor?.username ?? '?'}
              size="md"
            />
            <TypeIcon type="comment" />
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

  if (item.type === 'follow') {
    const text = formatActorsText(item.actors, item.total_count, 'started following you');
    return (
      <li>
        <Link href={href} onClick={handleClick} className={rowClass}>
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
