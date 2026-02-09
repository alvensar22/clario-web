import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]/like
 * Returns { count, liked } for the post.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [countRes, likedRes] = await Promise.all([
    supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
    user
      ? (supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()) as Promise<{
          data: { id: string } | null;
        }>
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    count: countRes.count ?? 0,
    liked: !!likedRes.data,
  });
}

/**
 * POST /api/posts/[id]/like
 * Like the post. Auth required.
 */
export async function POST(request: Request, { params }: RouteParams) {
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

  const { error } = await supabase.from('likes').insert({
    post_id: postId,
    user_id: user.id,
  } as never);

  if (error) {
    if (error.code === '23505') {
      const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
      return NextResponse.json({ count: count ?? 0, liked: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
  return NextResponse.json({ count: count ?? 0, liked: true });
}

/**
 * DELETE /api/posts/[id]/like
 * Unlike the post. Auth required.
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

  await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
  const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
  return NextResponse.json({ count: count ?? 0, liked: false });
}
