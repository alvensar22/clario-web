import { getApiClient } from '@/lib/api/server';
import { redirect, notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { PostCard } from '@/components/post/post-card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id: postId } = await params;
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data: post, error } = await api.getPost(postId);
  if (error || !post) notFound();

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80">
          {/* Return button */}
          <div className="sticky top-0 z-10 border-b border-neutral-800/80 bg-black/95 px-4 py-3 backdrop-blur-sm">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to feed
            </Link>
          </div>
          <PostCard
            post={post}
            variant="feed"
            currentUserId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
