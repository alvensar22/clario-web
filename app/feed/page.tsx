import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav, type FeedTab } from '@/components/layout/top-nav';
import { FeedList } from '@/components/feed/feed-list';
import { FeedEmpty } from '@/components/feed/feed-empty';

export const dynamic = 'force-dynamic';

interface FeedPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data: interestsData } = await api.getMyInterests();
  if ((interestsData?.interestIds?.length ?? 0) === 0) redirect('/onboarding/interests');

  const { tab } = await searchParams;
  const feed: FeedTab = ['following', 'interests', 'explore'].includes(tab ?? '') ? (tab as FeedTab) : 'explore';

  const { data } = await api.getPosts(feed);
  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <TopNav />
      <main className="ml-20 pt-14">
        <div className="mx-auto max-w-2xl border-x border-neutral-800">
          {posts.length === 0 ? (
            <FeedEmpty variant={feed} />
          ) : (
            <FeedList posts={posts} currentUserId={session.user.id} />
          )}
        </div>
      </main>
    </div>
  );
}
