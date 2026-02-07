'use server';

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
 * Server action to upload avatar (calls API with cookie-forwarded request).
 * We need to forward the file to the API; the server-side client doesn't support FormData yet.
 * So we keep this as a proxy: receive FormData, then call API with the same file.
 */
async function getCookieHeader(): Promise<string> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

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

    if (!file.type.startsWith('image/')) {
      return { message: 'File must be an image' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        message: `Image size (${fileSizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`,
      };
    }
  } catch (error) {
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

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cookieHeader = await getCookieHeader();
  const body = new FormData();
  body.append('avatar', file);

  const res = await fetch(`${base}/api/users/me/avatar`, {
    method: 'POST',
    body,
    headers: {
      Cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let parsed: { avatarUrl?: string; error?: string };
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }

  if (!res.ok) {
    return { message: parsed.error || res.statusText || 'Upload failed' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');

  return { success: true, avatarUrl: parsed.avatarUrl ?? '' };
}

export async function deleteAvatar(
  _prevState: AvatarResult | null,
  _formData?: FormData
): Promise<AvatarResult> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cookieHeader = await getCookieHeader();

  const res = await fetch(`${base}/api/users/me/avatar`, {
    method: 'DELETE',
    headers: {
      Cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let parsed: { error?: string };
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }

  if (!res.ok) {
    return { message: parsed.error || res.statusText || 'Delete failed' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');

  return { success: true, avatarUrl: '' };
}
