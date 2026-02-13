import { createClientFromRequest, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/chats?limit=20&offset=0
 * List chats for the current user with last message and unread count.
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

  const { data: participants, error: partError } = await supabase
    .from('chat_participants')
    .select('chat_id, last_read_at')
    .eq('user_id', user.id)
    .order('chat_id');

  if (partError || !participants?.length) {
    return NextResponse.json({ chats: [], hasMore: false });
  }

  const chatIds = participants.map((p) => p.chat_id);
  const lastReadMap = new Map(participants.map((p) => [p.chat_id, p.last_read_at]));

  const { data: chatsData, error: chatsError } = await supabase
    .from('chats')
    .select('id, updated_at')
    .in('id', chatIds)
    .order('updated_at', { ascending: false });

  if (chatsError || !chatsData?.length) {
    return NextResponse.json({ chats: [], hasMore: false });
  }

  const paginated = chatsData.slice(offset, offset + limit);

  // RLS only allows reading own participant rows; use service role to get other participant
  const adminClient = createServiceRoleClient();

  const result: {
    id: string;
    other_user: { id: string; username: string | null; avatar_url: string | null };
    last_message: { content: string; created_at: string; sender_id: string } | null;
    unread_count: number;
    updated_at: string;
  }[] = [];

  for (const chat of paginated) {
    const { data: otherPart } = await adminClient
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chat.id)
      .neq('user_id', user.id)
      .maybeSingle();

    const otherId = (otherPart as { user_id: string } | null)?.user_id ?? null;
    if (!otherId) continue;

    const { data: otherUser } = await adminClient
      .from('users')
      .select('id, username, avatar_url')
      .eq('id', otherId)
      .single();

    const { data: lastMsg } = await supabase
      .from('chat_messages')
      .select('content, created_at, sender_id')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastRead = lastReadMap.get(chat.id) ?? null;
    let count = 0;
    if (lastRead) {
      const { count: c } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .neq('sender_id', user.id)
        .gt('created_at', lastRead);
      count = c ?? 0;
    } else {
      const { count: c } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .neq('sender_id', user.id);
      count = c ?? 0;
    }

    result.push({
      id: chat.id,
      other_user: otherUser ?? { id: otherId, username: null, avatar_url: null },
      last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id } : null,
      unread_count: count,
      updated_at: chat.updated_at,
    });
  }

  return NextResponse.json({
    chats: result,
    hasMore: offset + limit < chatsData.length,
  });
}

/**
 * POST /api/chats
 * Body: { userId: string } – Create or get existing 1:1 chat with that user.
 */
export async function POST(request: Request) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const otherUserId = body.userId;
  if (!otherUserId || otherUserId === user.id) {
    return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id);

  const myChatIds = new Set((existing ?? []).map((r) => (r as { chat_id: string }).chat_id));

  const { data: otherPart } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', otherUserId);

  for (const row of otherPart ?? []) {
    const cid = (row as { chat_id: string }).chat_id;
    if (myChatIds.has(cid)) {
      return NextResponse.json({ chatId: cid });
    }
  }

  // Use service role to insert chat + both participants (RLS only allows inserting own user_id)
  const adminClient = createServiceRoleClient();

  const { data: newChat, error: insertChatError } = await adminClient
    .from('chats')
    .insert({})
    .select('id')
    .single();

  if (insertChatError || !newChat) {
    console.error('[chats] Insert chat error:', insertChatError);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }

  const { error: insertPartError } = await adminClient.from('chat_participants').insert([
    { chat_id: newChat.id, user_id: user.id },
    { chat_id: newChat.id, user_id: otherUserId },
  ] as never);

  if (insertPartError) {
    console.error('[chats] Insert participants error:', insertPartError);
    return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
  }

  return NextResponse.json({ chatId: newChat.id });
}
