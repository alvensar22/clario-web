import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/signin
 * Body: { email: string, password: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { email, password } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'Please enter a valid email address' },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { error: 'Password is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  const session = data.session;
  return NextResponse.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    access_token: session?.access_token ?? undefined,
    refresh_token: session?.refresh_token ?? undefined,
  });
}
