import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Route handler for Supabase auth callback
 * Handles email verification and OAuth redirects
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // If email confirmation was successful, ensure user record exists
    if (data.user && !error) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // Create user record if it doesn't exist
      if (!existingUser) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
        });
      }
    }
  }

  // Redirect to onboarding for new users, or the specified page
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    if (!userProfile?.username) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Redirect to the specified page or home
  return NextResponse.redirect(new URL(next, request.url));
}
