import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]
 * Returns a user's public profile by username.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: 'Username required' },
      { status: 400 }
    );
  }

  const supabase = await createClientFromRequest(request);

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, created_at, is_premium')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}
