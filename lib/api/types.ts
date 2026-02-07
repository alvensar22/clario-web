/**
 * Shared API types for client, server, and route handlers.
 * Single source of truth for request/response shapes.
 */

/** Current session from GET /api/auth/session and sign-in/up responses */
export interface ApiSession {
  user: ApiUser | null;
}

/** Minimal user identity from auth */
export interface ApiUser {
  id: string;
  email: string | null;
}

/** Full profile from GET /api/users/me and PATCH response */
export interface ApiUserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/** Public profile from GET /api/users/[username] */
export interface ApiPublicProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/** Body for PATCH /api/users/me */
export interface ApiUpdateMeBody {
  username?: string;
  bio?: string;
}

/** Generic API result from fetch helpers */
export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
}

/** Avatar upload success response */
export interface ApiAvatarResponse {
  avatarUrl?: string;
}

/** Avatar/error response from API (error field when not ok) */
export interface ApiAvatarErrorResponse {
  error?: string;
}

/** Single interest from GET /api/interests */
export interface ApiInterest {
  id: string;
  name: string;
  slug: string;
}

/** Response from GET /api/users/me/interests */
export interface ApiUserInterestsResponse {
  interestIds: string[];
}

/** Body for PUT /api/users/me/interests */
export interface ApiPutUserInterestsBody {
  interestIds: string[];
}

/** Response from GET /api/users/[username]/interests */
export interface ApiPublicProfileInterestsResponse {
  interests: ApiInterest[];
}

/** Category from GET /api/categories */
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

/** Post as returned in feed / user posts (with author and category) */
export interface ApiPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  category_id: string | null;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null };
  category?: { name: string } | null;
}

/** Body for POST /api/posts */
export interface ApiCreatePostBody {
  content: string;
  media_url?: string | null;
  category_id?: string | null;
}

/** Response from POST /api/posts/upload */
export interface ApiPostUploadResponse {
  url: string;
}
