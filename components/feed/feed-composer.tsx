'use client';

import type { ApiInterest } from '@/lib/api/types';
import { PostComposer } from '@/components/post/post-composer';
import { useRouter } from 'next/navigation';

interface FeedComposerProps {
  currentUser: { username: string; avatar_url: string | null };
  interests: ApiInterest[];
}

/**
 * Reusable "create post" block to place above a feed.
 * Refreshes the current page after a successful post so the new post appears in the list.
 */
export function FeedComposer({ currentUser, interests }: FeedComposerProps) {
  const router = useRouter();

  return (
    <section className="border-b border-neutral-800/60 px-4 py-2">
      <PostComposer
        currentUser={currentUser}
        interests={interests}
        onSuccess={() => router.refresh()}
      />
    </section>
  );
}
