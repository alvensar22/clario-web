import { createClient } from '@/lib/supabase/server';
import type { UsersInsert } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
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

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Insert user into public.users table
  if (!error && data?.user) {
    const insert: UsersInsert = {
      id: data.user.id,
      email: data.user.email ?? '',
    };
    await supabase.from('users').insert(insert as never).select().single().then(({ error: insertError }) => {
      if (insertError) {
        console.error('Error inserting user:', insertError);
      }
    });
  }

  return NextResponse.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
  });
}
