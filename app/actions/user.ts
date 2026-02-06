'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface UsernameError {
  message: string;
  field?: string;
}

export interface UsernameSuccess {
  success: true;
}

export type UsernameResult = UsernameError | UsernameSuccess;

/**
 * Server action to update username for the current user
 */
export async function updateUsername(
  _prevState: UsernameResult | null,
  formData: FormData
): Promise<UsernameResult> {
  const username = formData.get('username') as string;

  // Validation
  if (!username || username.trim().length === 0) {
    return { message: 'Username is required', field: 'username' };
  }

  const trimmedUsername = username.trim().toLowerCase();

  // Username validation rules
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

  // Only allow alphanumeric characters, underscores, and hyphens
  if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
    return {
      message:
        'Username can only contain letters, numbers, underscores, and hyphens',
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
    .eq('username', trimmedUsername)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is what we want
    return { message: 'Error checking username availability' };
  }

  if (existingUser && existingUser.id !== user.id) {
    return {
      message: 'This username is already taken',
      field: 'username',
    };
  }

  // First, check if user record exists, if not create it
  const { data: existingUserRecord, error: recordCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  // If there's an error other than "not found", return it
  if (recordCheckError && recordCheckError.code !== 'PGRST116') {
    console.error('Error checking user record:', recordCheckError);
    return {
      message: 'Error checking user record. Please try again.',
    };
  }

  // If record doesn't exist, create it
  if (!existingUserRecord) {
    // Create user record if it doesn't exist
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        username: trimmedUsername,
      });

    if (insertError) {
      console.error('Error creating user record:', insertError);
      return {
        message: insertError.message || 'Failed to create user record',
      };
    }
  } else {
    // Update username in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ username: trimmedUsername })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating username:', updateError);
      return {
        message: updateError.message || 'Failed to update username',
      };
    }
  }

  // Verify the update was successful
  const { data: updatedUser, error: verifyError } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  if (verifyError) {
    console.error('Error verifying username update:', verifyError);
    return {
      message: `Error verifying update: ${verifyError.message}`,
    };
  }

  if (!updatedUser?.username) {
    console.error('Username not found after update');
    return {
      message: 'Username update failed. Please try again.',
    };
  }

  // Revalidate all relevant paths
  revalidatePath('/', 'layout');
  revalidatePath('/onboarding', 'page');
  revalidatePath('/', 'page');
  
  return { success: true };
}
