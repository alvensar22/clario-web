import Link from 'next/link';
import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';

export const dynamic = 'force-dynamic';

export default async function PostNotFound() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80 px-4 py-12 text-center">
          <p className="mb-4 text-neutral-400">This post doesn’t exist or was removed.</p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-4 hover:underline"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to feed
          </Link>
        </div>
      </main>
    </div>
  );
}
