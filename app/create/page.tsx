import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { PostComposer } from '@/components/post/post-composer';

export default async function CreatePostPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const [{ data: me }, { data: interests }] = await Promise.all([
    api.getMe(),
    api.getInterests(),
  ]);
  if (!me?.username) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} />
      <TopNav />
      <main className="ml-20 pt-14">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <PostComposer
            currentUser={{ username: me.username, avatar_url: me.avatar_url }}
            interests={interests ?? []}
          />
        </div>
      </main>
    </div>
  );
}
