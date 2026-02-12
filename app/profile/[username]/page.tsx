import { getApiClient } from '@/lib/api/server';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Avatar } from '@/components/avatar/avatar';
import { Button } from '@/components/ui/button';
import { ProfileFollowButton } from '@/components/profile/profile-follow-button';
import { ProfilePostsList } from '@/components/profile/profile-posts-list';
import { PremiumBadge } from '@/components/premium/premium-badge';
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
    { data: followStatus },
  ] = await Promise.all([
    api.getSession(),
    api.getUserByUsername(username),
    api.getPublicProfileInterests(username),
    api.getUserPosts(username),
    api.getFollowStatus(username),
  ]);

  if (error || !userProfile || !userProfile.username) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === userProfile.id;
  const displayName = userProfile.username;
  const bio = userProfile.bio || null;
  const interests = interestsData?.interests ?? [];
  const posts = postsData?.posts ?? [];
  const follow = followStatus ?? { following: false, followerCount: 0, followingCount: 0 };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        username={isOwnProfile ? userProfile.username : undefined}
        isPremium={isOwnProfile ? userProfile.is_premium : undefined}
      />
      <TopNav />
      <main className="ml-56 pt-14">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
            <div className="shrink-0">
              <Avatar
                src={userProfile.avatar_url || undefined}
                fallback={displayName}
                size="xl"
                alt={`${displayName}'s avatar`}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {displayName}
                  </h1>
                  {userProfile.is_premium && (
                    <PremiumBadge size="lg" ariaLabel="Premium member" />
                  )}
                </div>
                <p className="text-sm text-neutral-400">
                  @{userProfile.username}
                </p>
              </div>

              {bio ? (
                <p className="mb-6 max-w-2xl text-base leading-relaxed text-neutral-300">
                  {bio}
                </p>
              ) : (
                <p className="mb-6 text-sm italic text-neutral-500">
                  No bio yet.
                </p>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-neutral-400">
                  Interests
                </h3>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest.id}
                        className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                      >
                        {interest.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-neutral-500">
                    No interests yet.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <ProfileFollowButton
                  username={username}
                  initialFollowing={follow.following}
                  initialFollowerCount={follow.followerCount}
                  initialFollowingCount={follow.followingCount}
                  isOwnProfile={isOwnProfile}
                />
              </div>

              {isOwnProfile && (
                <Link href="/profile/edit">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Posts
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {isOwnProfile
                ? 'Your posts appear here'
                : `${displayName}'s posts`}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/50 py-16">
              <svg
                className="h-10 w-10 text-neutral-600"
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
              <p className="mt-4 text-sm font-medium text-white">
                No posts yet
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {isOwnProfile
                  ? 'Share something from the create page.'
                  : 'Check back later.'}
              </p>
            </div>
          ) : (
            <ProfilePostsList
              posts={posts}
              currentUserId={session?.user?.id ?? null}
            />
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
