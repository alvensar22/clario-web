import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { ActivityList } from '@/components/activity/activity-list';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data, error } = await api.getActivity(10, 0);
  const initialActivity = data?.activity ?? [];
  const initialHasMore = data?.hasMore ?? false;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80">
          <div className="sticky top-0 z-10 border-b border-neutral-800/80 bg-black/95 px-4 py-4 backdrop-blur-sm">
            <h1 className="text-xl font-bold text-white">Activity</h1>
            <p className="mt-0.5 text-sm text-neutral-400">
              Your likes, comments, and follows
            </p>
          </div>
          {error ? (
            <div className="px-4 py-8 text-center text-red-400">{error}</div>
          ) : (
            <ActivityList initialItems={initialActivity} initialHasMore={initialHasMore} />
          )}
        </div>
      </main>
    </div>
  );
}
