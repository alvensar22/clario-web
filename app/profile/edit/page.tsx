import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { AvatarUpload } from '@/components/avatar/avatar-upload';
import { BioEditor } from '@/components/profile/bio-editor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const [{ data: userProfile }, { data: myInterestsData }, { data: allInterests }] = await Promise.all([
    api.getMe(),
    api.getMyInterests(),
    api.getInterests(),
  ]);

  if (!userProfile?.username) {
    redirect('/onboarding');
  }

  const interestIds = new Set(myInterestsData?.interestIds ?? []);
  const interestNames = (allInterests ?? [])
    .filter((i) => interestIds.has(i.id))
    .map((i) => i.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={userProfile.username} isPremium={userProfile.is_premium} />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Edit Profile
          </h1>
          <p className="text-sm text-neutral-400">
            Manage your profile settings
          </p>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-100">
              Avatar
            </h2>
            <AvatarUpload currentAvatarUrl={userProfile?.avatar_url} />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-100">
              Bio
            </h2>
            <BioEditor currentBio={userProfile?.bio ?? null} />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-sm font-medium text-neutral-100">
              Interests
            </h2>
            <p className="mb-4 text-sm text-neutral-400">
              Control what you see in your feed.
            </p>
            {interestNames.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {interestNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm italic text-neutral-500">
                No interests selected yet.
              </p>
            )}
            <Link
              href="/onboarding/interests?returnTo=/profile/edit"
              className="inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-800"
            >
              Edit interests
            </Link>
          </div>

          <div className="flex justify-end">
            <Link href={`/profile/${userProfile.username}`}>
              <Button variant="secondary">View Profile</Button>
            </Link>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
