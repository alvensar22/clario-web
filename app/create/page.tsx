import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { PostComposer } from '@/components/post/post-composer';

export default async function CreatePostPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const [{ data: me }, { data: categories }] = await Promise.all([
    api.getMe(),
    api.getCategories(),
  ]);
  if (!me?.username) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-xl px-4 py-8">
        <PostComposer
          currentUser={{ username: me.username, avatar_url: me.avatar_url }}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
