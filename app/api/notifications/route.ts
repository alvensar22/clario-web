import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ApiNotificationAggregated, ApiNotificationType } from '@/lib/api/types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
/** Fetch more raw rows to allow grouping; pagination applies to aggregated result */
const RAW_FETCH_SIZE = 300;

type RawRow = {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
};

function groupKey(row: RawRow): string {
  if (row.type === 'like' || row.type === 'comment') {
    return `${row.type}:${row.post_id ?? ''}`;
  }
  return `${row.type}:`;
}

/**
 * GET /api/notifications?limit=20&offset=0
 * Returns aggregated notifications for the current user. Auth required.
 * Groups by (type, post_id) for like/comment; by type for follow.
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
    .limit(RAW_FETCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rawRows = (rows ?? []) as RawRow[];

  const groupMap = new Map<string, RawRow[]>();
  for (const row of rawRows) {
    const key = groupKey(row);
    const list = groupMap.get(key) ?? [];
    list.push(row);
    groupMap.set(key, list);
  }

  const aggregated: ApiNotificationAggregated[] = [];
  for (const [, list] of groupMap) {
    const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const seen = new Set<string>();
    const uniqueByActor: RawRow[] = [];
    for (const r of sorted) {
      if (seen.has(r.actor_id)) continue;
      seen.add(r.actor_id);
      uniqueByActor.push(r);
    }
    const top2 = uniqueByActor.slice(0, 2);
    const total = uniqueByActor.length;
    const mostRecent = sorted[0];
    const anyUnread = list.some((r) => !r.read_at);

    aggregated.push({
      ids: list.map((r) => r.id),
      type: mostRecent.type as ApiNotificationType,
      post_id: mostRecent.post_id,
      comment_id: mostRecent.comment_id,
      actors: top2.map((r) => ({ id: r.actor_id, username: null as string | null, avatar_url: null as string | null })),
      total_count: total,
      read_at: anyUnread ? null : mostRecent.read_at,
      created_at: mostRecent.created_at,
    });
  }

  aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const paginated = aggregated.slice(offset, offset + limit);
  const hasMore = offset + limit < aggregated.length || rawRows.length === RAW_FETCH_SIZE;

  const actorIds = new Set(paginated.flatMap((a) => a.actors.map((x) => x.id)));
  if (actorIds.size > 0) {
    const { data: actors } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', [...actorIds]);

    const actorsMap = new Map((actors ?? []).map((a) => [a.id, { username: a.username, avatar_url: a.avatar_url }]));
    for (const agg of paginated) {
      for (const a of agg.actors) {
        const u = actorsMap.get(a.id);
        if (u) {
          a.username = u.username;
          a.avatar_url = u.avatar_url;
        }
      }
    }
  }

  return NextResponse.json({
    notifications: paginated,
    hasMore,
  });
}
