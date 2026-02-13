import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chats/unread-count
 * Returns total unread chat message count for the current user.
 */
export async function GET(request: Request) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ count: 0 });
  }

  const { data: participants } = await supabase
    .from('chat_participants')
    .select('chat_id, last_read_at')
    .eq('user_id', user.id);

  if (!participants?.length) {
    return NextResponse.json({ count: 0 });
  }

  let total = 0;
  for (const p of participants) {
    const lastRead = (p as { last_read_at: string | null }).last_read_at ?? '1970-01-01';
    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('chat_id', (p as { chat_id: string }).chat_id)
      .neq('sender_id', user.id)
      .gt('created_at', lastRead);
    total += count ?? 0;
  }

  return NextResponse.json({ count: total });
}
