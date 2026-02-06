'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface BioError {
  message: string;
}

export interface BioSuccess {
  success: true;
}

export type BioResult = BioError | BioSuccess;

/**
 * Server action to update bio for the current user
 */
export async function updateBio(
  _prevState: BioResult | null,
  formData: FormData
): Promise<BioResult> {
  const bio = formData.get('bio') as string | null;

  // Bio is optional, but if provided, validate length
  if (bio !== null && bio.length > 500) {
    return {
      message: 'Bio must be less than 500 characters',
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: 'You must be signed in to update your bio' };
  }

  // Update bio in users table
  const { error: updateError } = await supabase
    .from('users')
    .update({ bio: bio?.trim() || null })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating bio:', updateError);
    return {
      message: updateError.message || 'Failed to update bio',
    };
  }

  // Get username for revalidation
  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  revalidatePath('/', 'layout');
  revalidatePath('/profile', 'page');
  if (userData?.username) {
    revalidatePath(`/profile/${userData.username}`, 'page');
  }

  return { success: true };
}
