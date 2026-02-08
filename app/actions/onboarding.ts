'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface OnboardingError {
  message: string;
  field?: string;
}

export interface OnboardingSuccess {
  success: true;
}

export type OnboardingResult = OnboardingError | OnboardingSuccess;

/**
 * Server action to update username during onboarding
 */
export async function updateUsername(
  _prevState: OnboardingResult | null,
  formData: FormData
): Promise<OnboardingResult> {
  const username = formData.get('username') as string;

  // Validation
  if (!username || username.trim().length === 0) {
    return { message: 'Username is required', field: 'username' };
  }

  if (username.length < 3) {
    return {
      message: 'Username must be at least 3 characters',
      field: 'username',
    };
  }

  if (username.length > 20) {
    return {
      message: 'Username must be less than 20 characters',
      field: 'username',
    };
  }

  // Validate username format (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      message: 'Username can only contain letters, numbers, and underscores',
      field: 'username',
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: 'You must be signed in to update your username' };
  }

  // Check if username is already taken
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is what we want
    return { message: 'Error checking username availability' };
  }

  if (existingUser) {
    return {
      message: 'This username is already taken',
      field: 'username',
    };
  }

  // Update user with username
  const { error: updateError } = await supabase
    .from('users')
    .update({ username: username.toLowerCase() })
    .eq('id', user.id);

  if (updateError) {
    return { message: updateError.message || 'Failed to update username' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
