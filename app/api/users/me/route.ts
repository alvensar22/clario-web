import { createClient } from '@/lib/supabase/server';
import type { UsersUpdate } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/users/me
 * Returns the current user's profile. Requires authentication.
 */
export async function GET() {
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

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, username, avatar_url, bio, created_at')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}

/**
 * PATCH /api/users/me
 * Body: { username?: string, bio?: string }
 */
export async function PATCH(request: Request) {
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

  let body: { username?: string; bio?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const updates: { username?: string; bio?: string | null } = {};

  if (body.username !== undefined) {
    const trimmed = body.username.trim().toLowerCase();
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }
    if (trimmed.length > 20) {
      return NextResponse.json(
        { error: 'Username must be less than 20 characters' },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }
    const { data: existing } = (await supabase
      .from('users')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle()) as { data: { id: string } | null };
    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 409 }
      );
    }
    updates.username = trimmed;
  }

  if (body.bio !== undefined) {
    if (body.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be less than 500 characters' },
        { status: 400 }
      );
    }
    updates.bio = body.bio?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const updatePayload: UsersUpdate = updates;
  const { data, error } = await supabase
    .from('users')
    .update(updatePayload as never)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
