'use client';

import type { ApiPost } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/avatar/avatar';
import { ImagePreview } from '@/components/ui/image-preview';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PostActions } from './post-actions';
import { PostCardMenu } from './post-card-menu';

interface PostCardProps {
  post: ApiPost;
  /** 'feed' = black theme (default), 'profile' = neutral border/muted text */
  variant?: 'feed' | 'profile';
  /** Current user id for showing delete on own posts */
  currentUserId?: string | null;
  /** Called after post is deleted (e.g. router.refresh) */
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, variant = 'feed', currentUserId, onDelete }: PostCardProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const username = post.author?.username ?? 'unknown';
  const avatarUrl = post.author?.avatar_url ?? null;
  const interestName = post.interest?.name;
  const isProfile = variant === 'profile';
  const isOwnPost = !!currentUserId && !!post.user_id && String(post.user_id) === String(currentUserId);

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

  const timeAgo = formatRelativeTime(post.created_at);

  return (
    <article className="px-4 py-3 transition-colors hover:bg-neutral-900/20">
      <div className="flex gap-3">
        <Link href={`/profile/${username}`} className="shrink-0 ring-offset-black focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">
          <Avatar
            src={avatarUrl ?? undefined}
            fallback={username}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          {/* Threads-style: @username · time · interest */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link href={`/profile/${username}`} className={`${linkClass} text-[15px]`}>
              @{username}
            </Link>
            <span className="text-neutral-500">·</span>
            <span className="text-[13px] text-neutral-500">{timeAgo}</span>
            {interestName && (
              <>
                <span className="text-neutral-500">·</span>
                <span className={tagClass}>{interestName}</span>
              </>
            )}
            {isOwnPost && (
              <span className="ml-1">
                <PostCardMenu
                  post={post}
                  variant={variant}
                  onDelete={onDelete}
                />
              </span>
            )}
          </div>
          <p className={`${contentClass} text-[15px] leading-[1.4] mt-0.5`}>{post.content}</p>
          {post.media_url && (
            <>
              <button
                onClick={() => setShowImagePreview(true)}
                className={`mt-3 overflow-hidden ${mediaBorderClass} cursor-zoom-in transition-opacity hover:opacity-90`}
              >
                <Image
                  src={post.media_url}
                  alt=""
                  width={600}
                  height={400}
                  className="aspect-video w-full object-cover"
                  unoptimized={post.media_url.includes('supabase')}
                />
              </button>
              {showImagePreview && (
                <ImagePreview
                  src={post.media_url}
                  alt={`Image from ${username}`}
                  onClose={() => setShowImagePreview(false)}
                />
              )}
            </>
          )}
          <PostActions post={post} variant={variant} />
        </div>
      </div>
    </article>
  );
}
