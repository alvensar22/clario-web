import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { FeedNav } from '@/components/feed/feed-nav';
import { FeedList } from '@/components/feed/feed-list';
import { FeedTabs, type FeedTab } from '@/components/feed/feed-tabs';
import { FeedEmpty } from '@/components/feed/feed-empty';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  
  // Not logged in - show landing page with sign in/sign up
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Welcome to Clario
            </h1>
            <p className="mb-8 text-neutral-600 dark:text-neutral-400">
              Connect with people who share your interests
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full" variant="primary">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full" variant="secondary">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - check onboarding status
  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data: interestsData } = await api.getMyInterests();
  if ((interestsData?.interestIds?.length ?? 0) === 0) redirect('/onboarding/interests');

  // Show feed for logged-in users who completed onboarding
  const { tab } = await searchParams;
  const feed: FeedTab = ['following', 'interests', 'explore'].includes(tab ?? '') ? (tab as FeedTab) : 'explore';

  const { data } = await api.getPosts(feed);
  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-black">
      <FeedNav theme="dark" />
      <div className="mx-auto max-w-xl border-x border-neutral-800">
        <div className="border-b border-neutral-800 px-4 py-4">
          <FeedTabs />
        </div>
        {posts.length === 0 ? (
          <FeedEmpty variant={feed} />
        ) : (
          <FeedList posts={posts} currentUserId={session.user.id} />
        )}
      </div>
    </div>
  );
}
