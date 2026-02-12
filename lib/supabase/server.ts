import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ROLE_KEY.'
    );
  }
  return { supabaseUrl, supabaseAnonKey };
};

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * This client handles cookies automatically for authentication.
 *
 * @returns Supabase client instance
 */
export async function createClient(): Promise<SupabaseClient<Database, 'public'>> {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client for Route Handlers, supporting both cookie-based auth (web)
 * and Authorization: Bearer <token> (e.g. mobile). Use this in API routes when you have
 * access to the Request object.
 */
export async function createClientFromRequest(
  request: Request
): Promise<SupabaseClient<Database, 'public'>> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }) as SupabaseClient<Database, 'public'>;
  }

  return createClient();
}

/**
 * Creates a Supabase client with service role key. Bypasses RLS.
 * Use only in trusted server-side code (e.g. webhooks). Never expose to client.
 */
export function createServiceRoleClient(): SupabaseClient<Database, 'public'> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const roleKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY;
  if (!supabaseUrl || !roleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ROLE_KEY. Required for webhook handlers that update user records. Use your project role key (not anon).'
    );
  }
  return createSupabaseClient<Database>(supabaseUrl, roleKey) as SupabaseClient<
    Database,
    'public'
  >;
}
