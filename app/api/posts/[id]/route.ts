import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/posts/[id]
 * Delete own post. Auth required.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
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

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle();

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

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle();

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
