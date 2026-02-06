import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AvatarUpload } from '@/components/avatar/avatar-upload';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile with avatar
  const { data: userProfile } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  // Check if user has completed onboarding
  if (!userProfile?.username) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Profile
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your profile settings
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AvatarUpload currentAvatarUrl={userProfile?.avatar_url} />
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                @{userProfile.username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
