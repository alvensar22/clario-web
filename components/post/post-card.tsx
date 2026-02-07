'use client';

import type { ApiPost } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import Image from 'next/image';
import Link from 'next/link';

interface PostCardProps {
  post: ApiPost;
  /** 'feed' = black theme (default), 'profile' = neutral border/muted text */
  variant?: 'feed' | 'profile';
}

export function PostCard({ post, variant = 'feed' }: PostCardProps) {
  const username = post.author?.username ?? 'unknown';
  const avatarUrl = post.author?.avatar_url ?? null;
  const categoryName = post.category?.name;
  const isProfile = variant === 'profile';

  const linkClass = isProfile
    ? 'font-medium text-neutral-900 dark:text-neutral-100 hover:underline'
    : 'font-medium text-white hover:underline';
  const tagClass = isProfile
    ? 'rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
    : 'rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-xs text-neutral-400';
  const contentClass = isProfile
    ? 'mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300'
    : 'mt-1 whitespace-pre-wrap text-neutral-200';
  const mediaBorderClass = isProfile
    ? 'rounded-lg border border-neutral-200 dark:border-neutral-800'
    : 'rounded-lg border border-neutral-800';
  const actionsClass = isProfile
    ? 'mt-4 flex gap-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
    : 'mt-4 flex gap-6 text-neutral-500 hover:text-white';

  return (
    <article className="p-4">
      <div className="flex gap-3">
        <Link href={`/profile/${username}`} className="shrink-0">
          <Avatar
            src={avatarUrl ?? undefined}
            fallback={username}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profile/${username}`} className={linkClass}>
              @{username}
            </Link>
            {categoryName && <span className={tagClass}>{categoryName}</span>}
          </div>
          <p className={contentClass}>{post.content}</p>
          {post.media_url && (
            <div className={`mt-3 overflow-hidden ${mediaBorderClass}`}>
              <Image
                src={post.media_url}
                alt=""
                width={600}
                height={400}
                className="aspect-video w-full object-cover"
                unoptimized={post.media_url.includes('supabase')}
              />
            </div>
          )}
          <div className={actionsClass}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm"
              aria-label="Like"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Like</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm"
              aria-label="Comment"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
