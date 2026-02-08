'use client';

import { updateUsername } from '@/app/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-supabase';
import { useSupabase } from '@/hooks/use-supabase';
import { useState } from 'react';

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [state, formAction, isPending] = useActionState(updateUsername, null);

  // Check if user already has a username
  useEffect(() => {
    async function checkUserProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!error && data?.username) {
        // User already has a username, redirect to home
        router.push('/');
      }
    }

    if (user && !userLoading) {
      checkUserProfile();
    }
  }, [user, userLoading, supabase, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleUsernameCheck = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      // Not found - username is available
      setUsernameAvailable(true);
    } else if (data) {
      setUsernameAvailable(false);
    } else {
      setUsernameAvailable(null);
    }
    setCheckingUsername(false);
  };

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
          onUsernameChange={handleUsernameCheck}
          usernameAvailable={usernameAvailable}
          checkingUsername={checkingUsername}
        />
      </div>
    </div>
  );
}

interface OnboardingFormProps {
  formAction: (formData: FormData) => void;
  state: { message?: string; field?: string; success?: boolean } | null;
  isPending: boolean;
  onUsernameChange: (username: string) => void;
  usernameAvailable: boolean | null;
  checkingUsername: boolean;
}

function OnboardingForm({
  formAction,
  state,
  isPending,
  onUsernameChange,
  usernameAvailable,
  checkingUsername,
}: OnboardingFormProps) {
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
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Username
        </label>
        <div className="relative">
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
            error={state?.field === 'username' || usernameAvailable === false}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9_]*$/.test(value)) {
                onUsernameChange(value);
              }
            }}
            className="pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingUsername ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
            ) : usernameAvailable === true ? (
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : usernameAvailable === false ? (
              <svg
                className="h-4 w-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : null}
          </div>
        </div>
        <div className="mt-1.5 space-y-1">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            3-20 characters, letters, numbers, and underscores only
          </p>
          {usernameAvailable === true && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Username is available
            </p>
          )}
          {usernameAvailable === false && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Username is already taken
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="primary"
        isLoading={isPending}
        disabled={usernameAvailable === false || checkingUsername}
      >
        Continue
      </Button>
    </form>
  );
}
