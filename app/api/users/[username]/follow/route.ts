import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]/follow
 * Returns { following, followerCount, followingCount }. Auth optional for counts.
 * GET /api/users/[username]/follow?list=followers|following
 * Returns { users } with list of users (id, username, avatar_url).
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { username } = await params;
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = (await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()) as { data: { id: string } | null; error: unknown };

  if (profileError || !profile) {
    return NextResponse.json(
      { error: (profileError as { message?: string })?.message ?? 'User not found' },
      { status: 404 }
    );
  }

  const list = new URL(request.url).searchParams.get('list');
  if (list === 'followers' || list === 'following') {
    const { data: rows, error } =
      list === 'followers'
        ? await supabase.from('follows').select('follower_id').eq('following_id', profile.id)
        : await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
    if (error) {
      return NextResponse.json(
        { error: (error as { message?: string }).message ?? 'Failed to fetch' },
        { status: 500 }
      );
    }
    const ids = (rows ?? []).map((r) => (list === 'followers' ? r.follower_id : r.following_id));
    if (ids.length === 0) return NextResponse.json({ users: [] });
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', ids);
    if (usersError) {
      return NextResponse.json(
        { error: (usersError as { message?: string }).message ?? 'Failed to fetch' },
        { status: 500 }
      );
    }
    return NextResponse.json({ users: users ?? [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [followerCountRes, followingCountRes, followingRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user
      ? (supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle()) as Promise<{ data: { follower_id: string } | null }>
      : Promise.resolve({ data: null }),
  ]);

  const followerCount = followerCountRes.count ?? 0;
  const followingCount = followingCountRes.count ?? 0;
  const following = !!followingRes.data;

  return NextResponse.json({
    following,
    followerCount,
    followingCount,
  });
}

/**
 * POST /api/users/[username]/follow
 * Follow the user. Auth required.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { username } = await params;
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()) as { data: { id: string } | null };

  if (!profile || profile.id === user.id) {
    return NextResponse.json({ error: 'User not found or cannot follow self' }, { status: 400 });
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: profile.id,
  } as never);

  if (error) {
    if (error.code === '23505') return NextResponse.json({ following: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ following: true });
}

/**
 * DELETE /api/users/[username]/follow
 * Unfollow the user. Auth required.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { username } = await params;
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()) as { data: { id: string } | null };

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', profile.id);

  return NextResponse.json({ following: false });
}
