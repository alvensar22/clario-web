'use client';

import type { ApiPost } from '@/lib/api/types';
import { PostCard } from '@/components/post/post-card';
import { useRouter } from 'next/navigation';

interface ProfilePostsListProps {
  posts: ApiPost[];
  currentUserId: string | null;
}

export function ProfilePostsList({ posts, currentUserId }: ProfilePostsListProps) {
  const router = useRouter();

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard
            post={post}
            variant="profile"
            currentUserId={currentUserId}
            onDelete={() => router.refresh()}
          />
        </li>
      ))}
    </ul>
  );
}
