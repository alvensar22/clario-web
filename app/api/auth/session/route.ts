import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/session
 * Returns the current user session. Used by web and mobile clients.
 * Supports cookie auth (web) or Authorization: Bearer <token> (mobile).
 * Always returns 200; use body.user === null when not authenticated (avoids 401 in console).
 */
export async function GET(request: Request) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // No valid session: return 200 with null user (avoids 401 Unauthorized in console)
  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
