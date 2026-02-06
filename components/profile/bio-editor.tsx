'use client';

import { updateBio } from '@/app/actions/profile';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BioEditorProps {
  currentBio: string | null;
}

export function BioEditor({ currentBio }: BioEditorProps) {
  const [state, formAction, isPending] = useActionState(updateBio, null);
  const [bio, setBio] = useState(currentBio || '');

  return (
    <form action={formAction} className="space-y-4">
      {state && 'message' in state && !('success' in state) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {state.message}
        </div>
      )}

      {state && 'success' in state && state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
          Bio updated successfully
        </div>
      )}

      <div>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          maxLength={500}
          className="w-full rounded-lg border border-neutral-200 bg-transparent px-4 py-2.5 text-sm transition-colors duration-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-0 dark:border-neutral-800 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-100"
        />
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {bio.length}/500 characters
        </p>
      </div>

      <Button type="submit" variant="primary" isLoading={isPending}>
        Save Bio
      </Button>
    </form>
  );
}
