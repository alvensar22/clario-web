/**
 * API client for browser / Client Components.
 * All requests include credentials (cookies) for auth.
 */

import type {
  ApiResult,
  ApiSession,
  ApiUserProfile,
  ApiPublicProfile,
  ApiUpdateMeBody,
  ApiAvatarResponse,
  ApiInterest,
  ApiUserInterestsResponse,
  ApiPutUserInterestsBody,
  ApiPost,
  ApiCreatePostBody,
  ApiUpdatePostBody,
  ApiPostUploadResponse,
  ApiFollowStatus,
  ApiFollowListResponse,
  ApiComment,
  ApiSearchResult,
  ApiActivityResponse,
  ApiNotificationsResponse,
  ApiNotificationUnreadCount,
  ApiChatsResponse,
  ApiChatMessagesResponse,
  ApiChatMessage,
  ApiChatUnreadCount,
} from '@/lib/api/types';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  const text = await res.text();
  let data: T | undefined;
  let error: string | undefined;

  try {
    const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (res.ok) {
      data = parsed as T;
    } else {
      error = (parsed.error as string) ?? res.statusText;
    }
  } catch {
    error = text || res.statusText;
  }

  return { data, error, status: res.status };
}

export const api = {
  async getSession(): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/session');
  },

  async signIn(email: string, password: string): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signUp(email: string, password: string): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signOut(): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>('/api/auth/signout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<ApiResult<ApiUserProfile>> {
    return fetchApi<ApiUserProfile>('/api/users/me');
  },

  async updateMe(body: ApiUpdateMeBody): Promise<ApiResult<ApiUserProfile>> {
    return fetchApi<ApiUserProfile>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async uploadAvatar(file: File): Promise<ApiResult<ApiAvatarResponse>> {
    const base = getBaseUrl();
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${base}/api/users/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const text = await res.text();
    let data: ApiAvatarResponse | undefined;
    let error: string | undefined;
    try {
      const parsed = (text ? JSON.parse(text) : {}) as ApiAvatarResponse & { error?: string } ;
      if (res.ok) {
        data = parsed;
      } else {
        error = parsed.error ?? res.statusText;
      }
    } catch {
      error = text || res.statusText;
    }
    return { data, error, status: res.status };
  },

  async deleteAvatar(): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>('/api/users/me/avatar', {
      method: 'DELETE',
    });
  },

  async getUserByUsername(username: string): Promise<ApiResult<ApiPublicProfile>> {
    return fetchApi<ApiPublicProfile>(`/api/users/${encodeURIComponent(username)}`);
  },

  async getInterests(): Promise<ApiResult<ApiInterest[]>> {
    return fetchApi<ApiInterest[]>('/api/interests');
  },

  async getMyInterests(): Promise<ApiResult<ApiUserInterestsResponse>> {
    return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests');
  },

  async putMyInterests(body: ApiPutUserInterestsBody): Promise<ApiResult<ApiUserInterestsResponse>> {
    return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async getPosts(feed?: 'following' | 'interests' | 'explore'): Promise<ApiResult<{ posts: ApiPost[] }>> {
    const url = feed ? `/api/posts?feed=${encodeURIComponent(feed)}` : '/api/posts';
    return fetchApi<{ posts: ApiPost[] }>(url);
  },

  async getPost(postId: string): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>(`/api/posts/${encodeURIComponent(postId)}`);
  },

  async createPost(body: ApiCreatePostBody): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updatePost(postId: string, body: ApiUpdatePostBody): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async uploadPostImage(file: File): Promise<ApiResult<ApiPostUploadResponse>> {
    const base = getBaseUrl();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${base}/api/posts/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const text = await res.text();
    let data: ApiPostUploadResponse | undefined;
    let error: string | undefined;
    try {
      const parsed = (text ? JSON.parse(text) : {}) as ApiPostUploadResponse & { error?: string };
      if (res.ok) data = parsed;
      else error = parsed.error ?? res.statusText;
    } catch {
      error = text || res.statusText;
    }
    return { data, error, status: res.status };
  },

  async getUserPosts(username: string): Promise<ApiResult<{ posts: ApiPost[] }>> {
    return fetchApi<{ posts: ApiPost[] }>(`/api/users/${encodeURIComponent(username)}/posts`);
  },

  async getFollowStatus(username: string): Promise<ApiResult<ApiFollowStatus>> {
    return fetchApi<ApiFollowStatus>(`/api/users/${encodeURIComponent(username)}/follow`);
  },

  async getFollowers(username: string): Promise<ApiResult<ApiFollowListResponse>> {
    return fetchApi<ApiFollowListResponse>(`/api/users/${encodeURIComponent(username)}/follow?list=followers`);
  },

  async getFollowing(username: string): Promise<ApiResult<ApiFollowListResponse>> {
    return fetchApi<ApiFollowListResponse>(`/api/users/${encodeURIComponent(username)}/follow?list=following`);
  },

  async followUser(username: string): Promise<ApiResult<{ following: boolean }>> {
    return fetchApi<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: 'POST',
    });
  },

  async unfollowUser(username: string): Promise<ApiResult<{ following: boolean }>> {
    return fetchApi<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: 'DELETE',
    });
  },

  async likePost(postId: string): Promise<ApiResult<{ count: number; liked: boolean }>> {
    return fetchApi<{ count: number; liked: boolean }>(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
    });
  },

  async unlikePost(postId: string): Promise<ApiResult<{ count: number; liked: boolean }>> {
    return fetchApi<{ count: number; liked: boolean }>(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'DELETE',
    });
  },

  async getComments(postId: string): Promise<ApiResult<{ comments: ApiComment[] }>> {
    return fetchApi<{ comments: ApiComment[] }>(`/api/posts/${encodeURIComponent(postId)}/comments`);
  },

  async addComment(postId: string, content: string): Promise<ApiResult<ApiComment>> {
    return fetchApi<ApiComment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deletePost(postId: string): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  },

  async search(q: string): Promise<ApiResult<ApiSearchResult>> {
    const trimmed = q?.trim() ?? '';
    if (!trimmed) return { data: { users: [], interests: [], posts: [] }, status: 200 };
    return fetchApi<ApiSearchResult>(
      `/api/search?q=${encodeURIComponent(trimmed)}`
    );
  },

  async getActivity(limit = 10, offset = 0): Promise<ApiResult<ApiActivityResponse>> {
    return fetchApi<ApiActivityResponse>(
      `/api/activity?limit=${limit}&offset=${offset}`
    );
  },

  async getNotifications(limit = 20, offset = 0): Promise<ApiResult<ApiNotificationsResponse>> {
    return fetchApi<ApiNotificationsResponse>(
      `/api/notifications?limit=${limit}&offset=${offset}`
    );
  },

  async getNotificationUnreadCount(): Promise<ApiResult<ApiNotificationUnreadCount>> {
    return fetchApi<ApiNotificationUnreadCount>('/api/notifications/unread-count');
  },

  async markNotificationRead(id?: string | string[]): Promise<ApiResult<{ success: boolean }>> {
    const body =
      typeof id === 'string' ? { id } : Array.isArray(id) && id.length > 0 ? { ids: id } : {};
    return fetchApi<{ success: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async subscribePush(subscription: PushSubscription): Promise<ApiResult<{ success: boolean }>> {
    const payload = subscription.toJSON();
    return fetchApi<{ success: boolean }>('/api/notifications/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: payload.endpoint,
        keys: payload.keys,
      }),
    });
  },

  async getChats(limit = 20, offset = 0): Promise<ApiResult<ApiChatsResponse>> {
    return fetchApi<ApiChatsResponse>(`/api/chats?limit=${limit}&offset=${offset}`);
  },

  async getChatUnreadCount(): Promise<ApiResult<ApiChatUnreadCount>> {
    return fetchApi<ApiChatUnreadCount>('/api/chats/unread-count');
  },

  async createOrGetChat(userId: string): Promise<ApiResult<{ chatId: string }>> {
    return fetchApi<{ chatId: string }>('/api/chats', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getChatMessages(chatId: string, limit = 50, offset = 0): Promise<ApiResult<ApiChatMessagesResponse>> {
    return fetchApi<ApiChatMessagesResponse>(
      `/api/chats/${chatId}/messages?limit=${limit}&offset=${offset}`
    );
  },

  async sendChatMessage(
    chatId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<ApiResult<ApiChatMessage>> {
    return fetchApi<ApiChatMessage>(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        ...(mediaUrls?.length ? { media_urls: mediaUrls } : {}),
      }),
    });
  },

  async uploadChatImage(file: File): Promise<ApiResult<{ url: string }>> {
    const base = getBaseUrl();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${base}/api/chats/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const text = await res.text();
    let data: { url: string } | undefined;
    let error: string | undefined;
    try {
      const parsed = (text ? JSON.parse(text) : {}) as { url?: string; error?: string };
      if (res.ok) data = parsed as { url: string };
      else error = parsed.error ?? res.statusText;
    } catch {
      error = text || res.statusText;
    }
    return { data, error, status: res.status };
  },

  async markChatRead(chatId: string): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(`/api/chats/${chatId}/read`, { method: 'POST' });
  },
};
