import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/avatar/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get current user to check if this is their profile
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch user profile by username
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, created_at')
    .eq('username', username)
    .maybeSingle();

  if (error || !userProfile || !userProfile.username) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === userProfile.id;
  const displayName = userProfile.username;
  const bio = userProfile.bio || null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar
                src={userProfile.avatar_url || undefined}
                fallback={displayName}
                size="xl"
                alt={`${displayName}'s avatar`}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-4">
                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {displayName}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  @{userProfile.username}
                </p>
              </div>

              {/* Bio */}
              {bio ? (
                <p className="mb-6 max-w-2xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {bio}
                </p>
              ) : (
                <p className="mb-6 text-sm italic text-neutral-400 dark:text-neutral-500">
                  No bio yet.
                </p>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <Link href="/profile">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="border-t border-neutral-200 pt-12 dark:border-neutral-800">
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Posts
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {isOwnProfile
                ? "Your posts will appear here"
                : `${displayName}'s posts will appear here`}
            </p>
          </div>

          {/* Empty State */}
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No posts yet
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {isOwnProfile
                  ? 'Start sharing your thoughts and ideas.'
                  : 'Check back later for posts.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
