import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]/posts
 * Returns posts by that user (public). With interest name.
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
    .select('id, user_id, content, media_url, interest_id, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)) as {
    data: {
      id: string;
      user_id: string;
      content: string;
      media_url: string | null;
      interest_id: string | null;
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
  const postIds = posts.map((p) => p.id);
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  const likedSet = new Set<string>();
  if (postIds.length > 0) {
    const [likesRes, commentsRes, myLikesRes] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
      currentUser
        ? (supabase.from('likes').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds) as Promise<{
            data: { post_id: string }[] | null;
          }>)
        : Promise.resolve({ data: null }),
    ]);
    (likesRes.data ?? []).forEach((r: { post_id: string }) => {
      likeCounts.set(r.post_id, (likeCounts.get(r.post_id) ?? 0) + 1);
    });
    (commentsRes.data ?? []).forEach((r: { post_id: string }) => {
      commentCounts.set(r.post_id, (commentCounts.get(r.post_id) ?? 0) + 1);
    });
    (myLikesRes.data ?? []).forEach((r) => likedSet.add(r.post_id));
  }

  const interestIds = [...new Set(posts.map((p) => p.interest_id).filter(Boolean))] as string[];
  const interestsRes =
    interestIds.length > 0
      ? await supabase.from('interests').select('id, name').in('id', interestIds)
      : { data: [] as { id: string; name: string }[] };
  const interestsMap = new Map(
    (interestsRes.data ?? []).map((i) => [i.id, { name: i.name }])
  );

  const postsWithInterest = posts.map((p) => ({
    ...p,
    author,
    interest: p.interest_id ? interestsMap.get(p.interest_id) ?? null : null,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
    liked: likedSet.has(p.id),
  }));

  return NextResponse.json({ posts: postsWithInterest });
}
