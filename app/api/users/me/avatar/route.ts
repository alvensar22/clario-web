import { createClient } from '@/lib/supabase/server';
import type { UsersUpdate } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /api/users/me/avatar
 * Upload avatar. Body: multipart/form-data with "avatar" file.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    );
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'File must be an image' },
      { status: 400 }
    );
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'Image must be less than 5MB' },
      { status: 400 }
    );
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 }
    );
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const updatePayload: UsersUpdate = { avatar_url: publicUrl };
  await supabase
    .from('users')
    .update(updatePayload as never)
    .eq('id', user.id);

  return NextResponse.json({ avatarUrl: publicUrl });
}

/**
 * DELETE /api/users/me/avatar
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()) as { data: { avatar_url: string | null } | null };

  if (profile?.avatar_url) {
    const url = new URL(profile.avatar_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('avatars') + 1).join('/');
    if (filePath) {
      await supabase.storage.from('avatars').remove([filePath]);
    }
  }

  const deletePayload: UsersUpdate = { avatar_url: null };
  const { error: updateError } = await supabase
    .from('users')
    .update(deletePayload as never)
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
