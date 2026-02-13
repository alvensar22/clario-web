import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

async function ensureInChat(supabase: Awaited<ReturnType<typeof createClientFromRequest>>, chatId: string, userId: string) {
  const { data } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/**
 * GET /api/chats/[chatId]/messages?limit=50&offset=0
 * List messages in a chat. Auth required, must be a participant.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
  }

  const inChat = await ensureInChat(supabase, chatId, user.id);
  if (!inChat) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

  const { data: rows, error } = await supabase
    .from('chat_messages')
    .select('id, chat_id, sender_id, content, media_urls, created_at, reply_to_id')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rawMessages = (rows ?? []).reverse();
  const messageIds = rawMessages.map((m) => m.id);
  const replyToIds = [...new Set(rawMessages.map((m) => (m as { reply_to_id?: string }).reply_to_id).filter(Boolean))] as string[];

  let replyToMap: Record<string, { id: string; content: string; sender_id: string }> = {};
  if (replyToIds.length > 0) {
    const { data: replyRows } = await supabase
      .from('chat_messages')
      .select('id, content, sender_id')
      .in('id', replyToIds);
    replyToMap = Object.fromEntries((replyRows ?? []).map((r) => [r.id, r]));
  }

  let reactionsMap: Record<string, { emoji: string; count: number; reacted_by_me: boolean }[]> = {};
  if (messageIds.length > 0) {
    const { data: reactionRows } = await supabase
      .from('chat_message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds);
    const byMessage: Record<string, { emoji: string; user_id: string }[]> = {};
    for (const r of reactionRows ?? []) {
      const mid = (r as { message_id: string }).message_id;
      if (!byMessage[mid]) byMessage[mid] = [];
      byMessage[mid].push({ emoji: (r as { emoji: string }).emoji, user_id: (r as { user_id: string }).user_id });
    }
    for (const [mid, arr] of Object.entries(byMessage)) {
      const byEmoji: Record<string, string[]> = {};
      for (const { emoji, user_id } of arr) {
        if (!byEmoji[emoji]) byEmoji[emoji] = [];
        byEmoji[emoji].push(user_id);
      }
      reactionsMap[mid] = Object.entries(byEmoji).map(([emoji, ids]) => ({
        emoji,
        count: ids.length,
        reacted_by_me: ids.includes(user.id),
      }));
    }
  }

  const messages = rawMessages.map((m) => {
    const replyToId = (m as { reply_to_id?: string }).reply_to_id;
    const replyTo = replyToId ? replyToMap[replyToId] : null;
    const reactions = reactionsMap[m.id] ?? [];
    const { reply_to_id, ...rest } = m as { reply_to_id?: string; [k: string]: unknown };
    return {
      ...rest,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, sender_id: replyTo.sender_id } : null,
      reactions,
    };
  });

  return NextResponse.json({
    messages,
    hasMore: rawMessages.length === limit,
  });
}

/**
 * POST /api/chats/[chatId]/messages
 * Body: { content: string } – Send a message.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
  }

  const inChat = await ensureInChat(supabase, chatId, user.id);
  if (!inChat) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { content?: string; media_urls?: string[]; reply_to_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const mediaUrls = Array.isArray(body.media_urls)
    ? body.media_urls.filter((u): u is string => typeof u === 'string')
    : [];
  const replyToId = typeof body.reply_to_id === 'string' ? body.reply_to_id : undefined;

  if (!content && mediaUrls.length === 0) {
    return NextResponse.json({ error: 'Content or images required' }, { status: 400 });
  }

  if (replyToId) {
    const { data: replyMsg } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('id', replyToId)
      .eq('chat_id', chatId)
      .maybeSingle();
    if (!replyMsg) {
      return NextResponse.json({ error: 'Reply target not found' }, { status: 400 });
    }
  }

  const insertData: { chat_id: string; sender_id: string; content: string; media_urls?: unknown; reply_to_id?: string } = {
    chat_id: chatId,
    sender_id: user.id,
    content: content || '',
  };
  if (mediaUrls.length > 0) insertData.media_urls = mediaUrls;
  if (replyToId) insertData.reply_to_id = replyToId;

  const { data: msg, error } = await supabase
    .from('chat_messages')
    .insert(insertData as never)
    .select('id, chat_id, sender_id, content, media_urls, created_at, reply_to_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { reply_to_id: rtId, ...rest } = msg as { reply_to_id?: string; [k: string]: unknown };
  let replyTo: { id: string; content: string; sender_id: string } | null = null;
  if (rtId) {
    const { data: rt } = await supabase
      .from('chat_messages')
      .select('id, content, sender_id')
      .eq('id', rtId)
      .single();
    if (rt) replyTo = { id: rt.id, content: rt.content, sender_id: rt.sender_id };
  }

  return NextResponse.json({
    ...rest,
    reply_to: replyTo,
    reactions: [],
  });
}
