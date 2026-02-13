import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { NotificationList } from '@/components/notifications/notification-list';
import { PushEnablePrompt } from '@/components/notifications/push-setup';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data, error } = await api.getNotifications(20, 0);
  const initial = data?.notifications ?? [];
  const initialHasMore = data?.hasMore ?? false;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} isPremium={me.is_premium} />
      <TopNav username={me.username} avatarUrl={me.avatar_url} isPremium={me.is_premium} />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80">
          <div className="sticky top-0 z-10 border-b border-neutral-800/80 bg-black/95 px-4 py-4 backdrop-blur-sm">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="mt-0.5 text-sm text-neutral-400">
              Likes, comments, follows, and more
            </p>
          </div>
          <PushEnablePrompt />
          {error ? (
            <div className="px-4 py-8 text-center text-red-400">{error}</div>
          ) : (
            <NotificationList initialItems={initial} initialHasMore={initialHasMore} />
          )}
        </div>
      </main>
    </div>
  );
}
