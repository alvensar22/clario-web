'use client';

import { signIn } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-supabase';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signIn, null);

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign in
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your credentials to access your account
          </p>
        </div>

        <LoginForm
          formAction={formAction}
          state={state}
          isPending={isPending}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

interface LoginFormProps {
  formAction: (formData: FormData) => void;
  state: { message?: string; field?: string; success?: boolean } | null;
  isPending: boolean;
}

function LoginForm({ formAction, state, isPending }: LoginFormProps) {
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push('/');
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && !state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {state.message}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
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
          error={state?.field === 'email'}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
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
          error={state?.field === 'password'}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="primary"
        isLoading={isPending}
      >
        Sign in
      </Button>
    </form>
  );
}
