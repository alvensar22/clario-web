/**
 * API client for Server Components and Server Actions.
 * Forwards cookies so the API recognizes the session.
 */

import type {
  ApiResult,
  ApiSession,
  ApiUserProfile,
  ApiPublicProfile,
  ApiUpdateMeBody,
  ApiInterest,
  ApiUserInterestsResponse,
  ApiPutUserInterestsBody,
  ApiPublicProfileInterestsResponse,
  ApiCategory,
  ApiPost,
  ApiCreatePostBody,
  ApiFollowStatus,
  ApiComment,
} from '@/lib/api/types';
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

    async getInterests(): Promise<ApiResult<ApiInterest[]>> {
      return fetchApi<ApiInterest[]>('/api/interests');
    },

    async getMyInterests(): Promise<ApiResult<ApiUserInterestsResponse>> {
      return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests', { cookieHeader });
    },

    async putMyInterests(body: ApiPutUserInterestsBody): Promise<ApiResult<ApiUserInterestsResponse>> {
      return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests', {
        method: 'PUT',
        body: JSON.stringify(body),
        cookieHeader,
      });
    },

    async getPublicProfileInterests(username: string): Promise<ApiResult<ApiPublicProfileInterestsResponse>> {
      return fetchApi<ApiPublicProfileInterestsResponse>(
        `/api/users/${encodeURIComponent(username)}/interests`,
        { cookieHeader }
      );
    },

    async getCategories(): Promise<ApiResult<ApiCategory[]>> {
      return fetchApi<ApiCategory[]>('/api/categories');
    },

    async getPosts(feed?: 'following' | 'interests' | 'explore'): Promise<ApiResult<{ posts: ApiPost[] }>> {
      const url = feed ? `/api/posts?feed=${encodeURIComponent(feed)}` : '/api/posts';
      return fetchApi<{ posts: ApiPost[] }>(url, { cookieHeader });
    },

    async createPost(body: ApiCreatePostBody): Promise<ApiResult<ApiPost>> {
      return fetchApi<ApiPost>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
        cookieHeader,
      });
    },

    async getUserPosts(username: string): Promise<ApiResult<{ posts: ApiPost[] }>> {
      return fetchApi<{ posts: ApiPost[] }>(
        `/api/users/${encodeURIComponent(username)}/posts`,
        { cookieHeader }
      );
    },

    async getFollowStatus(username: string): Promise<ApiResult<ApiFollowStatus>> {
      return fetchApi<ApiFollowStatus>(
        `/api/users/${encodeURIComponent(username)}/follow`,
        { cookieHeader }
      );
    },

    async followUser(username: string): Promise<ApiResult<{ following: boolean }>> {
      return fetchApi<{ following: boolean }>(
        `/api/users/${encodeURIComponent(username)}/follow`,
        { method: 'POST', cookieHeader }
      );
    },

    async unfollowUser(username: string): Promise<ApiResult<{ following: boolean }>> {
      return fetchApi<{ following: boolean }>(
        `/api/users/${encodeURIComponent(username)}/follow`,
        { method: 'DELETE', cookieHeader }
      );
    },

    async getComments(postId: string): Promise<ApiResult<{ comments: ApiComment[] }>> {
      return fetchApi<{ comments: ApiComment[] }>(
        `/api/posts/${encodeURIComponent(postId)}/comments`,
        { cookieHeader }
      );
    },

    async deletePost(postId: string): Promise<ApiResult<{ success: boolean }>> {
      return fetchApi<{ success: boolean }>(`/api/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        cookieHeader,
      });
    },
  };
}
