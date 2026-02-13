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
    .select('id, chat_id, sender_id, content, media_urls, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = (rows ?? []).reverse();
  return NextResponse.json({
    messages,
    hasMore: messages.length === limit,
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

  let body: { content?: string; media_urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const mediaUrls = Array.isArray(body.media_urls)
    ? body.media_urls.filter((u): u is string => typeof u === 'string')
    : [];

  if (!content && mediaUrls.length === 0) {
    return NextResponse.json({ error: 'Content or images required' }, { status: 400 });
  }

  const insertData: { chat_id: string; sender_id: string; content: string; media_urls?: unknown } = {
    chat_id: chatId,
    sender_id: user.id,
    content: content || '',
  };
  if (mediaUrls.length > 0) {
    insertData.media_urls = mediaUrls;
  }

  const { data: msg, error } = await supabase
    .from('chat_messages')
    .insert(insertData as never)
    .select('id, chat_id, sender_id, content, media_urls, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(msg);
}
