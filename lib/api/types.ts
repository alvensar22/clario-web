/**
 * Shared API types for client, server, and route handlers.
 * Single source of truth for request/response shapes.
 */

/** Current session from GET /api/auth/session and sign-in/up responses */
export interface ApiSession {
  user: ApiUser | null;
  /** Returned on sign-in/sign-up for mobile clients; store and send as Authorization: Bearer */
  access_token?: string;
  refresh_token?: string;
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
  is_premium?: boolean;
}

/** Public profile from GET /api/users/[username] */
export interface ApiPublicProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_premium?: boolean;
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

/** Post as returned in feed / user posts (with author and interest) */
export interface ApiPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  interest_id: string | null;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null; is_premium?: boolean };
  interest?: { name: string } | null;
  like_count?: number;
  comment_count?: number;
  liked?: boolean;
}

/** Follow status from GET /api/users/[username]/follow */
export interface ApiFollowStatus {
  following: boolean;
  followerCount: number;
  followingCount: number;
}

/** User summary in followers/following list */
export interface ApiFollowListUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/** Response from GET /api/users/[username]/followers and /following */
export interface ApiFollowListResponse {
  users: ApiFollowListUser[];
}

/** Comment as returned from GET /api/posts/[id]/comments */
export interface ApiComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null };
}

/** Body for POST /api/posts */
export interface ApiCreatePostBody {
  content: string;
  media_url?: string | null;
  interest_id?: string | null;
}

/** Body for PATCH /api/posts/[id] */
export interface ApiUpdatePostBody {
  content?: string;
  media_url?: string | null;
  interest_id?: string | null;
}

/** Response from POST /api/posts/upload */
export interface ApiPostUploadResponse {
  url: string;
}

/** Response from POST /api/ai/detect-interest */
export interface ApiAiDetectInterestResponse {
  interest_id: string | null;
  interest_name: string | null;
  confidence: number;
}

/** One user in GET /api/search response */
export interface ApiSearchUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/** Response from GET /api/search */
export interface ApiSearchResult {
  users: ApiSearchUser[];
  interests: ApiInterest[];
  posts: ApiPost[];
}

/** Activity item: only actions you did (like, comment, follow) */
export type ApiActivityItem =
  | {
      type: 'like';
      id: string;
      created_at: string;
      post_id: string;
      post: { id: string; content: string; author: { username: string | null; avatar_url: string | null } };
    }
  | {
      type: 'comment';
      id: string;
      created_at: string;
      post_id: string;
      comment_id: string;
      comment_content: string;
      post: { id: string; content: string; author: { username: string | null; avatar_url: string | null } };
    }
  | {
      type: 'follow';
      id: string;
      created_at: string;
      user: { id: string; username: string | null; avatar_url: string | null };
    };

/** Response from GET /api/activity */
export interface ApiActivityResponse {
  activity: ApiActivityItem[];
  hasMore: boolean;
}
