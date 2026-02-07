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
