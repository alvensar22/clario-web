'use server';

import { getApiClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';

export interface UsernameError {
  message: string;
  field?: string;
}

export interface UsernameSuccess {
  success: true;
}

export type UsernameResult = UsernameError | UsernameSuccess;

/**
 * Server action to update username for the current user (calls API).
 */
export async function updateUsername(
  _prevState: UsernameResult | null,
  formData: FormData
): Promise<UsernameResult> {
  const username = formData.get('username') as string;

  if (!username || username.trim().length === 0) {
    return { message: 'Username is required', field: 'username' };
  }

  const trimmedUsername = username.trim().toLowerCase();

  if (trimmedUsername.length < 3) {
    return {
      message: 'Username must be at least 3 characters',
      field: 'username',
    };
  }

  if (trimmedUsername.length > 20) {
    return {
      message: 'Username must be less than 20 characters',
      field: 'username',
    };
  }

  if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
    return {
      message:
        'Username can only contain letters, numbers, underscores, and hyphens',
      field: 'username',
    };
  }

  const api = await getApiClient();
  const { error, status } = await api.updateMe({ username: trimmedUsername });

  if (error) {
    const field = status === 409 ? 'username' : undefined;
    return { message: error, field };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/onboarding', 'page');
  revalidatePath('/', 'page');

  return { success: true };
}
