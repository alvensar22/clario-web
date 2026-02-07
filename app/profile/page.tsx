import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
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

  const { data: userProfile } = await api.getMe();

  if (!userProfile?.username) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Edit Profile
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your profile settings
          </p>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Avatar
            </h2>
            <AvatarUpload currentAvatarUrl={userProfile?.avatar_url} />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Bio
            </h2>
            <BioEditor currentBio={userProfile?.bio ?? null} />
          </div>

          <div className="flex justify-end">
            <Link href={`/profile/${userProfile.username}`}>
              <Button variant="secondary">View Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
