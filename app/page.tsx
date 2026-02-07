import { getApiClient } from '@/lib/api/server';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar/avatar';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  const user = session?.user ?? null;

  let userProfile: { username: string; avatar_url: string | null } | null = null;
  if (user) {
    const { data: me } = await api.getMe();
    if (me?.username) {
      userProfile = { username: me.username, avatar_url: me.avatar_url ?? null };
    } else {
      redirect('/onboarding');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {user
              ? `Signed in as ${user.email}`
              : 'Get started by signing in to your account'}
          </p>
        </div>

        <div className="space-y-4">
          {user && userProfile ? (
            <>
              <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <Avatar
                  src={userProfile.avatar_url || undefined}
                  fallback={user.email || ''}
                  size="lg"
                />
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    @{userProfile.username}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/profile/${userProfile.username}`}>
                  <Button className="w-full" variant="secondary">
                    View Profile
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button className="w-full" variant="ghost">
                    Edit Profile
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button type="submit" className="w-full" variant="ghost">
                    Sign out
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full" variant="primary">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full" variant="secondary">
                  Create account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
