import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav, type FeedTab } from '@/components/layout/top-nav';
import { FeedComposer } from '@/components/feed/feed-composer';
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

  const [{ data }, { data: interests }] = await Promise.all([
    api.getPosts(feed),
    api.getInterests(),
  ]);
  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80">
          <FeedComposer
            currentUser={{ username: me.username, avatar_url: me.avatar_url }}
            interests={interests ?? []}
          />
          {posts.length === 0 ? (
            <FeedEmpty variant={feed} />
          ) : (
            <FeedList posts={posts} currentUserId={session.user.id} feedType={feed} />
          )}
        </div>
      </main>
    </div>
  );
}
