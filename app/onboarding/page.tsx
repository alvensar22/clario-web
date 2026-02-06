'use client';

import { updateUsername } from '@/app/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSupabase } from '@/hooks/use-supabase';

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateUsername, null);
  const [checkingUsername, setCheckingUsername] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user already has a username
    if (user && !userLoading) {
      supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setCheckingUsername(false);
          if (data?.username) {
            router.push('/');
          }
        })
        .catch(() => {
          setCheckingUsername(false);
        });
    }
  }, [user, userLoading, router, supabase]);

  useEffect(() => {
    if (state?.success) {
      // Use replace to avoid adding to history, and refresh to ensure server data is fetched
      router.refresh();
      // Small delay to ensure database update is committed and cache is cleared
      const timer = setTimeout(() => {
        router.replace('/');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  if (userLoading || checkingUsername || !user) {
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
            Choose your username
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Pick a unique username to complete your profile
          </p>
        </div>

        <OnboardingForm
          formAction={formAction}
          state={state}
          isPending={isPending}
        />
      </div>
    </div>
  );
}

interface OnboardingFormProps {
  formAction: (formData: FormData) => void;
  state: { message?: string; field?: string; success?: boolean } | null;
  isPending: boolean;
}

function OnboardingForm({
  formAction,
  state,
  isPending,
}: OnboardingFormProps) {
  return (
    <form action={formAction} className="space-y-4">
      {state?.message && !state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
          Username updated successfully! Redirecting...
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Username
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="johndoe"
          required
          autoComplete="username"
          autoFocus
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_-]+"
          error={state?.field === 'username'}
        />
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          3-20 characters, letters, numbers, underscores, and hyphens only
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="primary"
        isLoading={isPending}
      >
        Continue
      </Button>
    </form>
  );
}
