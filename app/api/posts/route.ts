import { createClient } from '@/lib/supabase/server';
import type { PostsInsert } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/posts
 * Feed: all posts ordered by latest. Returns posts with author and category.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: rows, error } = (await supabase
    .from('posts')
    .select('id, user_id, content, media_url, category_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)) as {
    data: {
      id: string;
      user_id: string;
      content: string;
      media_url: string | null;
      category_id: string | null;
      created_at: string;
    }[] | null;
    error: unknown;
  };

  if (error) {
    return NextResponse.json(
      { error: (error as { message?: string }).message ?? 'Failed to fetch' },
      { status: 500 }
    );
  }

  const posts = rows ?? [];
  if (posts.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const categoryIds = [...new Set(posts.map((p) => p.category_id).filter(Boolean))] as string[];

  const [usersRes, categoriesRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, username, avatar_url').in('id', userIds)
      : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] },
    categoryIds.length > 0
      ? supabase.from('categories').select('id, name').in('id', categoryIds)
      : { data: [] as { id: string; name: string }[] },
  ]);

  const usersMap = new Map(
    (usersRes.data ?? []).map((u) => [u.id, { username: u.username, avatar_url: u.avatar_url }])
  );
  const categoriesMap = new Map(
    (categoriesRes.data ?? []).map((c) => [c.id, { name: c.name }])
  );

  const postsWithMeta = posts.map((p) => ({
    ...p,
    author: usersMap.get(p.user_id),
    category: p.category_id ? categoriesMap.get(p.category_id) ?? null : null,
  }));

  return NextResponse.json({ posts: postsWithMeta });
}

/**
 * POST /api/posts
 * Create a post. Body: { content: string, media_url?: string, category_id?: string }. Auth required.
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

  let body: { content?: string; media_url?: string | null; category_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return NextResponse.json(
      { error: 'Content is required' },
      { status: 400 }
    );
  }

  const insert: PostsInsert = {
    user_id: user.id,
    content,
    media_url: body.media_url ?? null,
    category_id: body.category_id ?? null,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(insert as never)
    .select('id, user_id, content, media_url, category_id, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
