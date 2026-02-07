'use server';

import { getApiClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';

export interface BioError {
  message: string;
}

export interface BioSuccess {
  success: true;
}

export type BioResult = BioError | BioSuccess;

/**
 * Server action to update bio for the current user (calls API).
 */
export async function updateBio(
  _prevState: BioResult | null,
  formData: FormData
): Promise<BioResult> {
  const bio = formData.get('bio') as string | null;

  if (bio !== null && bio.length > 500) {
    return {
      message: 'Bio must be less than 500 characters',
    };
  }

  const api = await getApiClient();
  const { error } = await api.updateMe({
    bio: bio?.trim() ?? '',
  });

  if (error) {
    return { message: error };
  }

  const { data: me } = await api.getMe();
  revalidatePath('/', 'layout');
  revalidatePath('/profile', 'page');
  if (me?.username) {
    revalidatePath(`/profile/${me.username}`, 'page');
  }

  return { success: true };
}
