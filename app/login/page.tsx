'use client';

import { api } from '@/lib/api/client';
import { AuthHeader, LogoIcon } from '@/components/layout/auth-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-auth';
import { useState } from 'react';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (user && !loading) {
    router.push('/');
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!email?.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsPending(true);
    const { error: err } = await api.signIn(email, password);
    setIsPending(false);

    if (err) {
      setError(err);
      return;
    }
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AuthHeader
        rightContent={
          <Link
            href="/signup"
            className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            Sign up
          </Link>
        }
      />

      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <LogoIcon className="h-16 w-16 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-400">
              Sign in to continue to Clario
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-neutral-300"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
                className="border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:ring-neutral-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-neutral-300"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:ring-neutral-600"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white py-2.5 text-black hover:bg-neutral-200"
              isLoading={isPending}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-white underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
