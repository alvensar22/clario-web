import { createClient } from '@/lib/supabase/server';
import type { PostsInsert } from '@/types/supabase';
import { NextResponse } from 'next/server';

type FeedType = 'following' | 'interests' | 'explore';

const POST_SELECT = 'id, user_id, content, media_url, interest_id, created_at';
type PostRow = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  interest_id: string | null;
  created_at: string;
};

async function getPostsWithMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: PostRow[],
  currentUserId?: string
) {
  if (rows.length === 0) return { posts: [] as ReturnType<typeof mapPost>[] };
  const postIds = rows.map((p) => p.id);
  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const interestIds = [...new Set(rows.map((p) => p.interest_id).filter(Boolean))] as string[];

  const likeCountPromise =
    postIds.length > 0
      ? supabase.from('likes').select('post_id').in('post_id', postIds).then((r) => {
          const counts = new Map<string, number>();
          (r.data ?? []).forEach((row: { post_id: string }) => {
            counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
          });
          return counts;
        })
      : Promise.resolve(new Map<string, number>());
  const commentCountPromise =
    postIds.length > 0
      ? supabase.from('comments').select('post_id').in('post_id', postIds).then((r) => {
          const counts = new Map<string, number>();
          (r.data ?? []).forEach((row: { post_id: string }) => {
            counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
          });
          return counts;
        })
      : Promise.resolve(new Map<string, number>());
  const likedSetPromise =
    currentUserId && postIds.length > 0
      ? supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
          .then((r) => new Set((r.data ?? []).map((x: { post_id: string }) => x.post_id)))
      : Promise.resolve(new Set<string>());

  const [usersRes, interestsRes, likeCounts, commentCounts, likedSet] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, username, avatar_url').in('id', userIds)
      : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] },
    interestIds.length > 0
      ? supabase.from('interests').select('id, name').in('id', interestIds)
      : { data: [] as { id: string; name: string }[] },
    likeCountPromise,
    commentCountPromise,
    likedSetPromise,
  ]);

  const usersMap = new Map(
    (usersRes.data ?? []).map((u) => [u.id, { username: u.username, avatar_url: u.avatar_url }])
  );
  const interestsMap = new Map(
    (interestsRes.data ?? []).map((i) => [i.id, { name: i.name }])
  );

  const mapPost = (p: PostRow) => ({
    ...p,
    author: usersMap.get(p.user_id),
    interest: p.interest_id ? interestsMap.get(p.interest_id) ?? null : null,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
    liked: likedSet.has(p.id),
  });
  return { posts: rows.map(mapPost) };
}

/**
 * GET /api/posts?feed=following|interests|explore
 * following: posts from users current user follows
 * interests: posts whose interest_id is in the user's selected interests
 * explore: all posts, latest first (default)
 * Auth required for following and interests; explore works without auth but feed page requires auth.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const feed = (searchParams.get('feed') ?? 'explore') as FeedType;
  if (!['following', 'interests', 'explore'].includes(feed)) {
    return NextResponse.json({ error: 'Invalid feed type' }, { status: 400 });
  }

  if (feed === 'following' || feed === 'interests') {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (feed === 'following') {
      const { data: followRows } = (await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)) as { data: { following_id: string }[] | null };
      const followingIds = (followRows ?? []).map((r) => r.following_id);
      if (followingIds.length === 0) {
        const result = await getPostsWithMeta(supabase, [], user.id);
        return NextResponse.json(result);
      }
      const { data: rows, error } = (await supabase
        .from('posts')
        .select(POST_SELECT)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50)) as { data: PostRow[] | null; error: unknown };
      if (error) {
        return NextResponse.json(
          { error: (error as { message?: string }).message ?? 'Failed to fetch' },
          { status: 500 }
        );
      }
      const result = await getPostsWithMeta(supabase, rows ?? [], user.id);
      return NextResponse.json(result);
    }

    if (feed === 'interests') {
      const { data: userInterestRows } = (await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id)) as { data: { interest_id: string }[] | null };
      const interestIds = (userInterestRows ?? []).map((r) => r.interest_id);
      if (interestIds.length === 0) {
        const result = await getPostsWithMeta(supabase, [], user.id);
        return NextResponse.json(result);
      }
      const { data: rows, error } = (await supabase
        .from('posts')
        .select(POST_SELECT)
        .in('interest_id', interestIds)
        .order('created_at', { ascending: false })
        .limit(50)) as { data: PostRow[] | null; error: unknown };
      if (error) {
        return NextResponse.json(
          { error: (error as { message?: string }).message ?? 'Failed to fetch' },
          { status: 500 }
        );
      }
      const result = await getPostsWithMeta(supabase, rows ?? [], user.id);
      return NextResponse.json(result);
    }
  }

  // explore: all posts (optional auth for like state)
  const {
    data: { user: exploreUser },
  } = await supabase.auth.getUser();
  const { data: rows, error } = (await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(50)) as { data: PostRow[] | null; error: unknown };

  if (error) {
    return NextResponse.json(
      { error: (error as { message?: string }).message ?? 'Failed to fetch' },
      { status: 500 }
    );
  }

  const result = await getPostsWithMeta(supabase, rows ?? [], exploreUser?.id);
  return NextResponse.json(result);
}

/**
 * POST /api/posts
 * Create a post. Body: { content: string, media_url?: string, interest_id?: string }. Auth required.
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

  let body: { content?: string; media_url?: string | null; interest_id?: string | null };
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
    interest_id: body.interest_id ?? null,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(insert as never)
    .select('id, user_id, content, media_url, interest_id, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
