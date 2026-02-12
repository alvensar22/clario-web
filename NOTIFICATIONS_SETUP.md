# Notifications Setup

In-app and push notifications for likes, comments, follows, and mentions.

## Database

Run migrations to create `notifications` and `push_subscriptions` tables:

```bash
supabase db push
# or apply migration 013_create_notifications.sql
```

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

## Mobile

- **Web (PWA)**: Push works in mobile browsers that support Web Push (Chrome, Firefox, Safari 16.4+).
- **Native apps**: For React Native/Expo, use Firebase Cloud Messaging (FCM) or OneSignal. This implementation is web-only; native would require a separate push provider integration.

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
- `POST /api/notifications/push/subscribe` – Register push subscription
