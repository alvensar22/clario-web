import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
 * POST /api/chats/[chatId]/messages/[messageId]/reactions
 * Body: { emoji: string } – Toggle reaction (add if not present, remove if present).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId, messageId } = await params;
  if (!chatId || !messageId) {
    return NextResponse.json({ error: 'Chat ID and message ID required' }, { status: 400 });
  }

  const inChat = await ensureInChat(supabase, chatId, user.id);
  if (!inChat) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: msg } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .maybeSingle();
  if (!msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  let body: { emoji?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const emoji = typeof body.emoji === 'string' ? body.emoji.trim() : '';
  if (!emoji || emoji.length > 10) {
    return NextResponse.json({ error: 'Valid emoji required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('chat_message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from('chat_message_reactions').delete().eq('id', existing.id).eq('user_id', user.id);
    return NextResponse.json({ action: 'removed', emoji });
  }

  const { error: insertError } = await supabase.from('chat_message_reactions').insert({
    message_id: messageId,
    user_id: user.id,
    emoji,
  } as never);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ action: 'added', emoji });
}
