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
 * Clickable composer trigger that opens PostComposerModal.
 * Shows avatar + placeholder text, opens modal on click.
 */
export function FeedComposer({ currentUser, interests }: FeedComposerProps) {
  const router = useRouter();
  const { openComposer } = usePostComposer();

  return (
    <section className="border-b border-neutral-800/60 px-4 py-3">
      <button
        onClick={() => openComposer(currentUser, interests, () => router.refresh())}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-900/40"
      >
        <Avatar
          src={currentUser.avatar_url ?? undefined}
          fallback={currentUser.username}
          size="md"
        />
        <span className="flex-1 text-[15px] text-neutral-500">
          Start a thread...
        </span>
      </button>
    </section>
  );
}
