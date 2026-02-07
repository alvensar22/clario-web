'use client';

import type { ApiPost } from '@/lib/api/types';
import { PostCard } from '@/components/post/post-card';

interface FeedListProps {
  posts: ApiPost[];
}

export function FeedList({ posts }: FeedListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-neutral-500">No posts yet.</p>
        <p className="mt-1 text-sm text-neutral-600">Be the first to share something.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-800/80">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
