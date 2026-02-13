import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/notifications/push/expo
 * Body: { token: string } – Expo push token (ExponentPushToken[...]).
 * Store push token for the current user. Auth required.
 * Used by clario-mobile to register for push notifications.
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

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token || !token.startsWith('ExponentPushToken[')) {
    return NextResponse.json(
      { error: 'Valid Expo push token is required' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('expo_push_tokens').upsert(
    {
      user_id: user.id,
      token,
    } as never,
    { onConflict: 'token' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
