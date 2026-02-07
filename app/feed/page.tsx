import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { FeedNav } from '@/components/feed/feed-nav';
import { FeedList } from '@/components/feed/feed-list';

export default async function FeedPage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  if (!session?.user) redirect('/login');

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { data: interestsData } = await api.getMyInterests();
  if ((interestsData?.interestIds?.length ?? 0) === 0) redirect('/onboarding/interests');

  const { data } = await api.getPosts();
  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-black">
      <FeedNav theme="dark" />
      <div className="mx-auto max-w-xl border-x border-neutral-800">
        <FeedList posts={posts} />
      </div>
    </div>
  );
}
