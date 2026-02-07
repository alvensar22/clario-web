'use client';

/**
 * @deprecated Prefer useAuth (useUser from '@/hooks/use-auth') and the API client.
 * Web and mobile should talk only to the API; Supabase is used only in API routes.
 */

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

/**
 * Custom hook to access Supabase client in Client Components.
 * Provides a singleton instance of the Supabase client.
 *
 * @returns Supabase client instance
 */
export function useSupabase() {
  const [client] = useState(() => createClient());
  return client;
}

/**
 * Custom hook to get the current authenticated user.
 * Automatically updates when auth state changes.
 *
 * @returns Object containing user, loading state, and error
 */
export function useUser() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
      if (userError) {
        setError(userError);
      } else {
        setUser(user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading, error };
}
