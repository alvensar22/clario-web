import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * POST /api/auth/signout
 * Signs out and redirects to /login when Accept is text/html (form submit).
 * Supports cookie auth (web) or Authorization: Bearer <token> (mobile).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClientFromRequest(request);
  await supabase.auth.signOut();

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.json({ success: true });
}
