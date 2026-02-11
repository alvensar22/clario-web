'use client';

import type { ApiInterest } from '@/lib/api/types';
import { usePostComposer } from '@/components/post/post-composer-provider';
import { Avatar } from '@/components/avatar/avatar';
import { useRouter } from 'next/navigation';

interface FeedComposerProps {
  currentUser: { username: string; avatar_url: string | null };
  interests: ApiInterest[];
}

/**
 * Clickable composer preview that opens PostComposerModal.
 * Shows a preview matching the modal composer layout.
 */
export function FeedComposer({ currentUser, interests }: FeedComposerProps) {
  const router = useRouter();
  const { openComposer } = usePostComposer();

  const handleClick = () => {
    openComposer(currentUser, interests, () => router.refresh());
  };

  return (
    <section className="border-b border-neutral-800/60 px-4 py-2">
      <div
        onClick={handleClick}
        className="cursor-pointer py-1"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Create a new post"
      >
        {/* Threads-style: avatar + single-line input that grows */}
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <Avatar
              src={currentUser.avatar_url ?? undefined}
              fallback={currentUser.username}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="min-h-[24px] w-full text-[15px] leading-6 text-neutral-500">
              Start a thread...
            </div>
          </div>
        </div>

        {/* Toolbar: icon actions + interest + Post */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Image upload button */}
            <div className="rounded-full p-2 text-neutral-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>

            {/* Interest: pill dropdown */}
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] text-neutral-500">
              <span>Topic</span>
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Post button */}
            <div className="flex items-center justify-center gap-2 rounded-full bg-white/40 px-4 py-2 text-[14px] font-semibold text-white/60">
              Post
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
