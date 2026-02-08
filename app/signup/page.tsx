'use client';

import { api } from '@/lib/api/client';
import { AuthHeader, LogoIcon } from '@/components/layout/auth-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-auth';

export default function SignUpPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    if (!email?.includes('@')) {
      setError('Please enter a valid email address');
      setFieldError('email');
      return;
    }
    if (!password) {
      setError('Password is required');
      setFieldError('password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setFieldError('password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setFieldError('confirmPassword');
      return;
    }

    setIsPending(true);
    const { error: err } = await api.signUp(email, password);
    setIsPending(false);

    if (err) {
      setError(err);
      return;
    }
    router.push('/onboarding');
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
            href="/login"
            className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            Log in
          </Link>
        }
      />

      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo and heading */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <LogoIcon className="h-16 w-16 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-sm text-neutral-400">
              Join Clario and connect with your interests
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
                error={fieldError === 'email'}
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
                autoComplete="new-password"
                minLength={6}
                error={fieldError === 'password'}
                className="border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:ring-neutral-600"
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-neutral-300"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
                error={fieldError === 'confirmPassword'}
                className="border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:ring-neutral-600"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white py-2.5 text-black hover:bg-neutral-200"
              isLoading={isPending}
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-white underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
