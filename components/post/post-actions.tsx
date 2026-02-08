'use client';

import { api } from '@/lib/api/client';
import { useCallback, useState } from 'react';
import type { ApiPost } from '@/lib/api/types';
import { PostComments } from './post-comments';

interface PostActionsProps {
  post: ApiPost;
  variant?: 'feed' | 'profile';
}

export function PostActions({
  post,
  variant = 'feed',
}: PostActionsProps) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [showComments, setShowComments] = useState(false);

  const isProfile = variant === 'profile';
  const actionsClass = isProfile
    ? 'mt-3 flex flex-wrap items-center gap-6 text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100'
    : 'mt-3 flex flex-wrap items-center gap-6 text-[13px] text-neutral-500 transition-colors hover:text-white';

  const toggleLike = useCallback(async () => {
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.data) {
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    }
  }, [post.id, liked]);

  return (
    <div className={actionsClass}>
      <button
        type="button"
        onClick={toggleLike}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <svg
          className="h-4 w-4"
          fill={liked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likeCount > 0 ? likeCount : ''} like{likeCount !== 1 ? 's' : ''}</span>
      </button>
      <button
        type="button"
        onClick={() => setShowComments((c) => !c)}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        aria-label="Comment"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Reply</span>
      </button>
      {showComments && (
        <div className={`mt-3 w-full border-t pt-3 ${variant === 'profile' ? 'border-neutral-200 dark:border-neutral-800' : 'border-neutral-800/60'}`}>
          <PostComments postId={post.id} variant={variant} />
        </div>
      )}
    </div>
  );
}
