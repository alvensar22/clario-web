'use client';

import { api } from '@/lib/api/client';
import type { ApiUser } from '@/lib/api/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to get current session from API.
 * Use this instead of Supabase client for web; same API can be used by mobile.
 */
export function useUser() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.getSession();
    setLoading(false);
    if (err) {
      setError(new Error(err));
      setUser(null);
      return;
    }
    setUser(data?.user ?? null);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return { user, loading, error, refetch };
}
