'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AvatarError {
  message: string;
}

export interface AvatarSuccess {
  success: true;
  avatarUrl: string;
}

export type AvatarResult = AvatarError | AvatarSuccess;

/**
 * Server action to upload avatar and update user profile
 */
export async function uploadAvatar(
  _prevState: AvatarResult | null,
  formData: FormData
): Promise<AvatarResult> {
  let file: File | null = null;

  try {
    file = formData.get('avatar') as File | null;

    if (!file) {
      return { message: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { message: 'File must be an image' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        message: `Image size (${fileSizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`,
      };
    }
  } catch (error) {
    // Handle body size limit errors from Next.js
    if (
      error instanceof Error &&
      (error.message.includes('Body exceeded') ||
        error.message.includes('bodySizeLimit') ||
        error.message.includes('413'))
    ) {
      return {
        message:
          'File size exceeds the 5MB limit. Please choose a smaller image.',
      };
    }
    console.error('Error validating file:', error);
    return { message: 'An error occurred while processing the file' };
  }

  if (!file) {
    return { message: 'No file provided' };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: 'You must be signed in to upload an avatar' };
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true, // Replace existing file if it exists
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return { message: uploadError.message || 'Failed to upload avatar' };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Update user record with avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating avatar URL:', updateError);
    // Don't fail completely - the file was uploaded successfully
    // Just log the error
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');

  return { success: true, avatarUrl: publicUrl };
}

/**
 * Server action to delete avatar
 */
export async function deleteAvatar(
  _prevState: AvatarResult | null,
  _formData?: FormData
): Promise<AvatarResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: 'You must be signed in to delete an avatar' };
  }

  // Get current avatar URL
  const { data: userProfile } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  // Delete from storage if exists
  if (userProfile?.avatar_url) {
    // Extract file path from URL
    const url = new URL(userProfile.avatar_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('avatars') + 1).join('/');

    if (filePath) {
      await supabase.storage.from('avatars').remove([filePath]);
    }
  }

  // Update user record to remove avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error deleting avatar:', updateError);
    return { message: updateError.message || 'Failed to delete avatar' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');

  return { success: true, avatarUrl: '' };
}
