/**
 * API client for Server Components and Server Actions.
 * Forwards cookies so the API recognizes the session.
 */

import type { ApiResult, ApiSession, ApiUserProfile, ApiPublicProfile, ApiUpdateMeBody } from '@/lib/api/types';
import { cookies } from 'next/headers';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

type FetchApiOptions = RequestInit & { cookieHeader?: string };

async function fetchApi<T>(path: string, options: FetchApiOptions = {}): Promise<ApiResult<T>> {
  const { cookieHeader, ...rest } = options;
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const headers: HeadersInit = {
    ...(rest.headers as HeadersInit),
  };
  if (cookieHeader) {
    (headers as Record<string, string>)['Cookie'] = cookieHeader;
  }
  if (!(rest.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] =
      (headers as Record<string, string>)['Content-Type'] || 'application/json';
  }

  const res = await fetch(url, {
    ...rest,
    headers,
    cache: 'no-store',
  });

  const text = await res.text();
  let data: T | undefined;
  let error: string | undefined;

  try {
    const parsed = text ? JSON.parse(text) : {};
    if (res.ok) {
      data = parsed as T;
    } else {
      error = parsed.error || res.statusText;
    }
  } catch {
    error = text || res.statusText;
  }

  return { data, error, status: res.status };
}

export async function getApiClient() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return {
    async getSession(): Promise<ApiResult<ApiSession>> {
      return fetchApi<ApiSession>('/api/auth/session', { cookieHeader });
    },

    async getMe(): Promise<ApiResult<ApiUserProfile>> {
      return fetchApi<ApiUserProfile>('/api/users/me', { cookieHeader });
    },

    async getUserByUsername(username: string): Promise<ApiResult<ApiPublicProfile>> {
      return fetchApi<ApiPublicProfile>(`/api/users/${encodeURIComponent(username)}`, { cookieHeader });
    },

    async updateMe(body: ApiUpdateMeBody): Promise<ApiResult<ApiUserProfile>> {
      return fetchApi<ApiUserProfile>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
        cookieHeader,
      });
    },
  };
}
