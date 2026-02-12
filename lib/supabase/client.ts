'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for Client Components.
 * Prefer anon key for Realtime (session auth); falls back to role key if anon not set.
 *
 * @returns Supabase client instance
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ROLE_KEY).'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, anonKey);
}
