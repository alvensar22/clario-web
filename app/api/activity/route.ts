import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type ActivityLike = {
  type: 'like';
  id: string;
  created_at: string;
  post_id: string;
  post: { id: string; content: string; author: { username: string | null; avatar_url: string | null } };
};
type ActivityComment = {
  type: 'comment';
  id: string;
  created_at: string;
  post_id: string;
  comment_id: string;
  comment_content: string;
  post: { id: string; content: string; author: { username: string | null; avatar_url: string | null } };
};
type ActivityFollow = {
  type: 'follow';
  id: string;
  created_at: string;
  user: { id: string; username: string | null; avatar_url: string | null };
};
export type ActivityItem = ActivityLike | ActivityComment | ActivityFollow;

const MAX_PAGE = 50;
const DEFAULT_LIMIT = 10;

/**
 * GET /api/activity?limit=10&offset=0
 * Returns only the current user's activity: posts they liked, comments they made, users they followed.
 * Auth required. Sorted by created_at desc. Paginated.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(MAX_PAGE, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

  const userId = user.id;
  const fetchSize = offset + limit;

  const [likesRes, commentsRes, followsRes] = await Promise.all([
    supabase
      .from('likes')
      .select('id, post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(fetchSize),
    supabase
      .from('comments')
      .select('id, post_id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(fetchSize),
    supabase
      .from('follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(fetchSize),
  ]);

  const likes = likesRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const follows = followsRes.data ?? [];

  const postIds = [
    ...new Set([
      ...likes.map((l) => l.post_id),
      ...comments.map((c) => c.post_id),
    ]),
  ];
  const followingIds = follows.map((f) => f.following_id);

  const postsRows =
    postIds.length > 0
      ? await supabase.from('posts').select('id, content, user_id').in('id', postIds)
      : { data: [] as { id: string; content: string; user_id: string }[] };

  const authorIds = [...new Set((postsRows.data ?? []).map((p) => p.user_id))];
  const userIds = [...new Set([...authorIds, ...followingIds])];

  const usersRes =
    userIds.length > 0
      ? await supabase.from('users').select('id, username, avatar_url').in('id', userIds)
      : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] };

  const postsMap = new Map(
    (postsRows.data ?? []).map((p) => [p.id, p])
  );
  const authorsMap = new Map(
    (usersRes.data ?? []).map((u) => [u.id, { username: u.username, avatar_url: u.avatar_url }])
  );
  const followedUsersMap = new Map(
    (usersRes.data ?? []).map((u) => [u.id, { id: u.id, username: u.username, avatar_url: u.avatar_url }])
  );

  const items: ActivityItem[] = [];

  for (const l of likes) {
    const post = postsMap.get(l.post_id);
    if (!post) continue;
    const author = authorsMap.get(post.user_id);
    items.push({
      type: 'like',
      id: `like-${l.id}`,
      created_at: l.created_at,
      post_id: l.post_id,
      post: {
        id: post.id,
        content: post.content,
        author: author ?? { username: null, avatar_url: null },
      },
    });
  }
  for (const c of comments) {
    const post = postsMap.get(c.post_id);
    if (!post) continue;
    const author = authorsMap.get(post.user_id);
    items.push({
      type: 'comment',
      id: `comment-${c.id}`,
      created_at: c.created_at,
      post_id: c.post_id,
      comment_id: c.id,
      comment_content: c.content,
      post: {
        id: post.id,
        content: post.content,
        author: author ?? { username: null, avatar_url: null },
      },
    });
  }
  for (const f of follows) {
    const u = followedUsersMap.get(f.following_id);
    if (!u) continue;
    items.push({
      type: 'follow',
      id: `follow-${f.following_id}-${f.created_at}`,
      created_at: f.created_at,
      user: u,
    });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const activity = items.slice(offset, offset + limit);
  const hasMore = items.length > offset + limit;

  return NextResponse.json({ activity, hasMore });
}
