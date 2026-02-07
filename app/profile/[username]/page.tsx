import { getApiClient } from '@/lib/api/server';
import { Avatar } from '@/components/avatar/avatar';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post/post-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const api = await getApiClient();

  const [
    { data: session },
    { data: userProfile, error },
    { data: interestsData },
    { data: postsData },
  ] = await Promise.all([
    api.getSession(),
    api.getUserByUsername(username),
    api.getPublicProfileInterests(username),
    api.getUserPosts(username),
  ]);

  if (error || !userProfile || !userProfile.username) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === userProfile.id;
  const displayName = userProfile.username;
  const bio = userProfile.bio || null;
  const interests = interestsData?.interests ?? [];
  const posts = postsData?.posts ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <Avatar
                src={userProfile.avatar_url || undefined}
                fallback={displayName}
                size="xl"
                alt={`${displayName}'s avatar`}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="mb-4">
                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {displayName}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  @{userProfile.username}
                </p>
              </div>

              {bio ? (
                <p className="mb-6 max-w-2xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {bio}
                </p>
              ) : (
                <p className="mb-6 text-sm italic text-neutral-400 dark:text-neutral-500">
                  No bio yet.
                </p>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Interests
                </h3>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest.id}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {interest.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
                    No interests yet.
                  </p>
                )}
              </div>

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

        <div className="border-t border-neutral-200 pt-12 dark:border-neutral-800">
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Posts
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {isOwnProfile
                ? 'Your posts appear here'
                : `${displayName}'s posts`}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
              <svg
                className="h-10 w-10 text-neutral-400 dark:text-neutral-600"
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
              <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No posts yet
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {isOwnProfile
                  ? 'Share something from the create page.'
                  : 'Check back later.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} variant="profile" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
