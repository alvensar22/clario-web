import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]/posts
 * Returns posts by that user (public). With category name.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: 'Username required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: profile, error: userError } = (await supabase
    .from('users')
    .select('id, username, avatar_url')
    .eq('username', username)
    .maybeSingle()) as { data: { id: string; username: string | null; avatar_url: string | null } | null; error: unknown };

  if (userError || !profile) {
    return NextResponse.json(
      { error: (userError as { message?: string })?.message ?? 'User not found' },
      { status: 404 }
    );
  }

  const author = { username: profile.username ?? username, avatar_url: profile.avatar_url };

  const { data: rows, error } = (await supabase
    .from('posts')
    .select('id, user_id, content, media_url, category_id, created_at')
    .eq('user_id', profile.id)
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
  const categoryIds = [...new Set(posts.map((p) => p.category_id).filter(Boolean))] as string[];
  const categoriesRes =
    categoryIds.length > 0
      ? await supabase.from('categories').select('id, name').in('id', categoryIds)
      : { data: [] as { id: string; name: string }[] };
  const categoriesMap = new Map(
    (categoriesRes.data ?? []).map((c) => [c.id, { name: c.name }])
  );

  const postsWithCategory = posts.map((p) => ({
    ...p,
    author,
    category: p.category_id ? categoriesMap.get(p.category_id) ?? null : null,
  }));

  return NextResponse.json({ posts: postsWithCategory });
}
