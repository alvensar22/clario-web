import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]/comments
 * Returns comments for the post with author (username, avatar_url). Order: oldest first.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClient();

  const { data: rows, error } = (await supabase
    .from('comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(100)) as {
    data: { id: string; post_id: string; user_id: string; content: string; created_at: string }[] | null;
    error: unknown;
  };

  if (error) {
    return NextResponse.json(
      { error: (error as { message?: string }).message ?? 'Failed to fetch' },
      { status: 500 }
    );
  }

  const comments = rows ?? [];
  if (comments.length === 0) {
    return NextResponse.json({ comments: [] });
  }

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .in('id', userIds);

  const usersMap = new Map(
    (users ?? []).map((u) => [u.id, { username: u.username, avatar_url: u.avatar_url }])
  );

  const withAuthor = comments.map((c) => ({
    ...c,
    author: usersMap.get(c.user_id),
  }));

  return NextResponse.json({ comments: withAuthor });
}

/**
 * POST /api/posts/[id]/comments
 * Add a comment. Body: { content: string }. Auth required.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 500) {
    return NextResponse.json({ error: 'Content required (max 500 chars)' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: user.id, content } as never)
    .select('id, post_id, user_id, content, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const author = { username: null as string | null, avatar_url: null as string | null };
  const { data: profile } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  if (profile) {
    author.username = profile.username;
    author.avatar_url = profile.avatar_url;
  }

  return NextResponse.json({ ...data, author });
}
