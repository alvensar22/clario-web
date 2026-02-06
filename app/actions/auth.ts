'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AuthError {
  message: string;
  field?: string;
}

export interface AuthSuccess {
  success: true;
}

export type AuthResult = AuthError | AuthSuccess;

/**
 * Server action to sign up a new user with email and password
 */
export async function signUp(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validation
  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address', field: 'email' };
  }

  if (!password || password.length < 6) {
    return {
      message: 'Password must be at least 6 characters',
      field: 'password',
    };
  }

  if (password !== confirmPassword) {
    return {
      message: 'Passwords do not match',
      field: 'confirmPassword',
    };
  }

  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (signUpError) {
    return { message: signUpError.message };
  }

  // Insert user into public.users table
  if (authData.user) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
      })
      .select()
      .single();

    if (insertError) {
      // If user already exists (e.g., from previous signup attempt), that's okay
      // We'll still redirect to onboarding
      console.error('Error inserting user:', insertError);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Server action to sign in an existing user with email and password
 */
export async function signIn(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address', field: 'email' };
  }

  if (!password) {
    return { message: 'Password is required', field: 'password' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Server action to sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}
