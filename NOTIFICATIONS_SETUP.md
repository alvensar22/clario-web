# Notifications Setup

In-app and push notifications for likes, comments, follows, and mentions.

## Database

Run migrations to create `notifications` and `push_subscriptions` tables and enable Realtime:

```bash
supabase db push
# Migrations: 013_create_notifications.sql, 014_enable_realtime_notifications.sql
```

Migration 014 adds `notifications` to the `supabase_realtime` publication so in-app notifications update in realtime.

## Web Push (Optional)

For push notifications in the browser:

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

3. Use HTTPS in production (push requires a secure context).

## Mobile (Expo / clario-mobile)

The **clario-mobile** app registers an Expo push token with this backend. When a like, comment, or follow is created, the server sends a push via Expo’s push service to the user’s device.

1. **Database**: Run migration `015_expo_push_tokens.sql` (creates `expo_push_tokens` table):
   ```bash
   supabase db push
   ```

2. **Backend dependency**: Install Expo push server SDK in **clario-web**:
   ```bash
   npm install expo-server-sdk
   ```

3. **clario-mobile** calls `POST /api/notifications/push/expo` with body `{ token: "ExponentPushToken[...]" }` (Bearer auth) after the user logs in. No extra env vars are required on the server for Expo push.

- **Web (PWA)**: Push works in mobile browsers that support Web Push (Chrome, Firefox, Safari 16.4+).

## Notification Types

| Type    | Trigger              | Recipient    |
|---------|----------------------|--------------|
| like    | User likes a post    | Post author  |
| comment | User comments on post| Post author  |
| follow  | User follows another | Followed user|
| mention | (Future) User @mentions| Mentioned user |

## Routes

- `GET /api/notifications` – List notifications (paginated)
- `GET /api/notifications/unread-count` – Unread count
- `POST /api/notifications/read` – Mark read (body: `{ id?: string }`)
- `POST /api/notifications/push/subscribe` – Register Web Push subscription
- `POST /api/notifications/push/expo` – Register Expo push token (clario-mobile)

## Realtime Troubleshooting

If notifications don't update in realtime:

1. **Run migrations** – `supabase db push` to add `notifications` to the Realtime publication.
2. **Use anon key for client** – For Realtime with session auth, set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The client uses it for Realtime; the role key is for server-only.
3. **Check Supabase Dashboard** – Database → Publications → supabase_realtime. Ensure `notifications` is listed.
4. **Console** – If you see `[Notifications] Realtime subscription failed`, Realtime may be disabled or the publication is missing. Polling (every 15s) will still update the list and badge.
