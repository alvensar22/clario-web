/**
 * Notification service: create in-app notifications and send push notifications.
 * Uses service role client (bypasses RLS) for inserting notifications.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention';

export interface CreateNotificationParams {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

/**
 * Creates an in-app notification. Call after like/comment/follow.
 * Skips if recipient is the actor (no self-notifications).
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, actorId, type, postId, commentId } = params;
  if (userId === actorId) return;

  let supabase: SupabaseClient;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return; // Service role not configured; skip silently
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId ?? null,
    comment_id: commentId ?? null,
  } as never);

  // Send push immediately in background (realtime); don't await so response isn't delayed
  sendPushToUser(userId, { type, actorId, postId, commentId }).catch(() => {});
  sendExpoPushToUser(userId, { type, actorId, postId, commentId }).catch(() => {});
}

/**
 * Sends Web Push to all subscriptions for the user.
 */
async function sendPushToUser(
  userId: string,
  payload: { type: NotificationType; actorId: string; postId?: string; commentId?: string }
): Promise<void> {
  const wp = await import('web-push').catch(() => null);
  if (!wp?.setVapidDetails || !wp?.sendNotification) return;

  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPrivate) return;

  let supabase: SupabaseClient;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return;
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs?.length) return;

  const { data: actor } = await supabase
    .from('users')
    .select('username')
    .eq('id', payload.actorId)
    .maybeSingle();

  const username = (actor as { username?: string | null } | null)?.username ?? 'Someone';
  const titles: Record<NotificationType, string> = {
    like: `${username} liked your post`,
    comment: `${username} commented on your post`,
    follow: `${username} started following you`,
    mention: `${username} mentioned you`,
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let url = baseUrl;
  if (payload.postId) url = `${baseUrl}/post/${payload.postId}`;
  else if (payload.actorId) url = `${baseUrl}/profile/${username}`;

  const pushPayload = JSON.stringify({
    title: titles[payload.type],
    url,
    type: payload.type,
  });

  wp.setVapidDetails(
    'mailto:support@clario.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    vapidPrivate
  );

  await Promise.allSettled(
    subs.map((sub) =>
      wp.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
        { TTL: 86400 }
      )
    )
  );
}

/**
 * Sends Expo Push notifications to all Expo tokens for the user (native app).
 */
async function sendExpoPushToUser(
  userId: string,
  payload: { type: NotificationType; actorId: string; postId?: string; commentId?: string }
): Promise<void> {
  const Expo = await import('expo-server-sdk').catch(() => null);
  if (!Expo?.default) return;

  let supabase: SupabaseClient;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return;
  }

  const { data: tokens } = await supabase
    .from('expo_push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!tokens?.length) return;

  const { data: actor } = await supabase
    .from('users')
    .select('username')
    .eq('id', payload.actorId)
    .maybeSingle();

  const username = (actor as { username?: string | null } | null)?.username ?? 'Someone';
  const titles: Record<NotificationType, string> = {
    like: `${username} liked your post`,
    comment: `${username} commented on your post`,
    follow: `${username} started following you`,
    mention: `${username} mentioned you`,
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let url = baseUrl;
  if (payload.postId) url = `${baseUrl}/post/${payload.postId}`;
  else if (payload.actorId) url = `${baseUrl}/profile/${username}`;

  const expo = new Expo.default();
  const messages = tokens
    .map((t) => t.token as string)
    .filter((token) => Expo.default.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      title: titles[payload.type],
      body: titles[payload.type],
      data: { url, type: payload.type, postId: payload.postId },
      sound: 'default',
    }));

  if (messages.length === 0) return;
  await expo.sendPushNotificationsAsync(messages);
}
