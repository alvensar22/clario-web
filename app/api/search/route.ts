import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const POST_SELECT = 'id, user_id, content, media_url, interest_id, created_at';
type PostRow = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  interest_id: string | null;
  created_at: string;
};

/** Escape % and _ for use in Supabase ilike pattern (avoid pattern injection) */
function escapeIlike(q: string): string {
  return q
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * GET /api/search?q=...
 * Search users (username), interests (name/slug), and posts (content). Public.
 * Returns { users, interests, posts } with limited counts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q')?.trim() ?? '';
  if (raw.length < 1) {
    return NextResponse.json(
      { users: [], interests: [], posts: [] }
    );
  }

  const supabase = await createClientFromRequest(request);
  const pattern = `%${escapeIlike(raw)}%`;

  const [
    usersRes,
    interestsByNameRes,
    interestsBySlugRes,
    postsRes,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, avatar_url')
      .not('username', 'is', null)
      .ilike('username', pattern)
      .limit(10),
    supabase
      .from('interests')
      .select('id, name, slug')
      .ilike('name', pattern)
      .limit(8),
    supabase
      .from('interests')
      .select('id, name, slug')
      .ilike('slug', pattern)
      .limit(8),
    supabase
      .from('posts')
      .select(POST_SELECT)
      .ilike('content', pattern)
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  const byId = new Map<string, { id: string; name: string; slug: string }>();
  for (const row of interestsByNameRes.data ?? []) {
    byId.set(row.id, row);
  }
  for (const row of interestsBySlugRes.data ?? []) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  const interests = Array.from(byId.values()).slice(0, 8);

  const users = (usersRes.data ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    avatar_url: u.avatar_url,
  }));

  const rows = (postsRes.data ?? []) as PostRow[];
  if (rows.length === 0) {
    return NextResponse.json({
      users,
      interests,
      posts: [],
    });
  }

  const postIds = rows.map((p) => p.id);
  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const interestIds = [...new Set(rows.map((p) => p.interest_id).filter(Boolean))] as string[];
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [usersMetaRes, interestsMetaRes, likeCountRes, commentCountRes, likedRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, username, avatar_url').in('id', userIds)
      : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] },
    interestIds.length > 0
      ? supabase.from('interests').select('id, name').in('id', interestIds)
      : { data: [] as { id: string; name: string }[] },
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    currentUser
      ? supabase.from('likes').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds)
      : { data: [] as { post_id: string }[] },
  ]);

  const usersMap = new Map(
    (usersMetaRes.data ?? []).map((u) => [u.id, { username: u.username, avatar_url: u.avatar_url }])
  );
  const interestsMap = new Map(
    (interestsMetaRes.data ?? []).map((i) => [i.id, { name: i.name }])
  );
  const likeCounts = new Map<string, number>();
  (likeCountRes.data ?? []).forEach((r: { post_id: string }) => {
    likeCounts.set(r.post_id, (likeCounts.get(r.post_id) ?? 0) + 1);
  });
  const commentCounts = new Map<string, number>();
  (commentCountRes.data ?? []).forEach((r: { post_id: string }) => {
    commentCounts.set(r.post_id, (commentCounts.get(r.post_id) ?? 0) + 1);
  });
  const likedSet = new Set((likedRes.data ?? []).map((r: { post_id: string }) => r.post_id));

  const posts = rows.map((p) => ({
    ...p,
    author: usersMap.get(p.user_id),
    interest: p.interest_id ? interestsMap.get(p.interest_id) ?? null : null,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
    liked: likedSet.has(p.id),
  }));

  return NextResponse.json({
    users,
    interests,
    posts,
  });
}
