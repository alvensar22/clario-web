import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]
 * Returns a single post with author, interest, like_count, comment_count, liked. Public.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClientFromRequest(request);

  const { data: row, error: fetchError } = (await supabase
    .from('posts')
    .select('id, user_id, content, media_url, interest_id, created_at')
    .eq('id', postId)
    .maybeSingle()) as {
    data: { id: string; user_id: string; content: string; media_url: string | null; interest_id: string | null; created_at: string } | null;
    error: unknown;
  };

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const [{ data: { user: currentUser } }] = await Promise.all([
    supabase.auth.getUser(),
  ]);

  const [userRes, interestRes, likeCountRes, commentCountRes, likedRes] = await Promise.all([
    supabase.from('users').select('id, username, avatar_url').eq('id', row.user_id).maybeSingle(),
    row.interest_id
      ? supabase.from('interests').select('id, name').eq('id', row.interest_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('likes').select('post_id').eq('post_id', postId),
    supabase.from('comments').select('id').eq('post_id', postId),
    currentUser
      ? supabase.from('likes').select('post_id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const userData = userRes.data as { username: string | null; avatar_url: string | null } | null;
  const interestData = interestRes.data as { name: string } | null;
  const author = userData ? { username: userData.username, avatar_url: userData.avatar_url } : undefined;
  const interest = interestData ? { name: interestData.name } : null;
  const like_count = (likeCountRes.data ?? []).length;
  const comment_count = (commentCountRes.data ?? []).length;
  const liked = !!likedRes.data;

  return NextResponse.json({
    ...row,
    author,
    interest,
    like_count,
    comment_count,
    liked,
  });
}

/**
 * DELETE /api/posts/[id]
 * Delete own post. Auth required.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: post, error: fetchError } = (await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle()) as { data: { user_id: string } | null; error: unknown };

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/posts/[id]
 * Update own post. Body: { content?: string, media_url?: string | null, interest_id?: string | null }. Auth required.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: post, error: fetchError } = (await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle()) as { data: { user_id: string } | null; error: unknown };

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { content?: string; media_url?: string | null; interest_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updates: { content?: string; media_url?: string | null; interest_id?: string | null } = {};
  if (typeof body.content === 'string') {
    const content = body.content.trim();
    if (!content) return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    updates.content = content;
  }
  if (body.media_url !== undefined) updates.media_url = body.media_url ?? null;
  if (body.interest_id !== undefined) updates.interest_id = body.interest_id ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates as never)
    .eq('id', postId)
    .select('id, user_id, content, media_url, interest_id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
