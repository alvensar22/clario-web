import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav, type FeedTab } from '@/components/layout/top-nav';
import { AuthHeader, LogoIcon } from '@/components/layout/auth-header';
import { FeedComposer } from '@/components/feed/feed-composer';
import { FeedList } from '@/components/feed/feed-list';
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
      <div className="min-h-screen bg-black">
        <AuthHeader
          rightContent={
            <>
              <Link href="/login">
                <Button variant="secondary" className="px-6">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" className="px-6">
                  Sign up
                </Button>
              </Link>
            </>
          }
        />

        {/* Hero Section */}
        <main className="mx-auto max-w-7xl px-6">
          <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center py-16 text-center">
            <div className="mb-8 flex items-center justify-center">
              <LogoIcon className="h-24 w-24 text-white" />
            </div>
            
            <h1 className="mb-6 text-6xl font-bold tracking-tight text-white sm:text-7xl">
              Connect with your
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                interests
              </span>
            </h1>
            
            <p className="mb-12 max-w-2xl text-xl text-neutral-400">
              Share your thoughts, discover new ideas, and connect with people who share your passions. 
              Join a community built around what you love.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button variant="primary" className="px-8 py-6 text-lg">
                  Get started for free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="px-8 py-6 text-lg">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="mt-24 grid gap-8 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Follow Your Interests</h3>
                <p className="text-sm text-neutral-400">
                  Choose from topics you care about and get a personalized feed of relevant content.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                  <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Share Your Voice</h3>
                <p className="text-sm text-neutral-400">
                  Post updates, share images, and engage with a community that gets you.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Build Connections</h3>
                <p className="text-sm text-neutral-400">
                  Follow people, like posts, and discover new perspectives from around the world.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-800 py-8">
          <div className="mx-auto max-w-7xl px-6 text-center text-sm text-neutral-500">
            <p>&copy; 2026 Clario. Connect with what matters.</p>
          </div>
        </footer>
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
