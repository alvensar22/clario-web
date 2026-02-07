'use client';

interface FeedEmptyProps {
  variant?: 'following' | 'interests' | 'explore';
}

/**
 * Premium empty state when the selected feed has no posts.
 */
export function FeedEmpty({ variant = 'explore' }: FeedEmptyProps) {
  const isFocus = variant === 'following' || variant === 'interests';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mx-auto max-w-sm">
        <p className="text-base font-medium tracking-tight text-white">
          {isFocus
            ? 'No posts in your focus yet'
            : 'No posts yet'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {isFocus && 'Follow creators or explore more topics.'}
          {variant === 'explore' && 'Be the first to share something.'}
        </p>
      </div>
    </div>
  );
}
