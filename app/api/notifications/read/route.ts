import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/notifications/read
 * Body: { id?: string } – if id provided, mark that notification read; else mark all read.
 * Auth required.
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

  let body: { id?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const now = new Date().toISOString();

  if (body.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now } as never)
      .eq('id', body.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now } as never)
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
