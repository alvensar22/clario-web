import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { ChatList } from '@/components/chat/chat-list';

export const dynamic = 'force-dynamic';

export default async function ChatsPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data } = await api.getChats(20, 0);
  const initialChats = data?.chats ?? [];
  const initialHasMore = data?.hasMore ?? false;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} isPremium={me.is_premium} />
      <TopNav username={me.username} avatarUrl={me.avatar_url} isPremium={me.is_premium} />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-[600px] border-x border-neutral-800/80">
          <div className="sticky top-0 z-10 border-b border-neutral-800/80 bg-black/95 px-4 py-4 backdrop-blur-sm">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <p className="mt-0.5 text-sm text-neutral-400">Chat with people you follow</p>
          </div>
          <ChatList initialChats={initialChats} initialHasMore={initialHasMore} />
        </div>
      </main>
    </div>
  );
}
