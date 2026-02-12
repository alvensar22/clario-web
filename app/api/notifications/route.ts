import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/notifications?limit=20&offset=0
 * Returns notifications for the current user. Auth required.
 */
export async function GET(request: Request) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, post_id, comment_id, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = rows ?? [];
  const actorIds = [...new Set(notifications.map((n) => n.actor_id))];

  const { data: actors } =
    actorIds.length > 0
      ? await supabase.from('users').select('id, username, avatar_url').in('id', actorIds)
      : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] };

  const actorsMap = new Map((actors ?? []).map((a) => [a.id, { username: a.username, avatar_url: a.avatar_url }]));

  const withActor = notifications.map((n) => ({
    ...n,
    actor: actorsMap.get(n.actor_id) ?? { username: null, avatar_url: null },
  }));

  return NextResponse.json({
    notifications: withActor,
    hasMore: notifications.length === limit,
  });
}
