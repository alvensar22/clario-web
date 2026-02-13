# Chat Messaging Setup

Real-time 1:1 chat messaging with Supabase Realtime.

## Database

Run migrations to create chat tables and enable Realtime:

```bash
supabase db push
# Migrations: 016_create_chats.sql, 017_enable_realtime_chat_messages.sql, 018_chat_media_urls.sql
```

## Features

- **Chat icon** in top nav (beside notification bell) with unread badge
- **Dropdown** on click – shows recent chats, "See all chats" links to `/chats`
- **Inline conversation panel** – Facebook-style, opens bottom-right when a chat is selected
- **Chats page** (`/chats`) – full list, start new chat by username
- **Message button** on user profiles – starts/opens chat with that user

Chat notifications (unread count) are **separate** from like/comment/follow notifications.

## Realtime

The `chat_messages` table is in the `supabase_realtime` publication. New messages appear instantly for both participants.

## Routes

- `GET /api/chats` – List chats (paginated)
- `POST /api/chats` – Create or get chat (body: `{ userId: string }`)
- `GET /api/chats/unread-count` – Unread message count
- `GET /api/chats/[chatId]/messages` – List messages
- `POST /api/chats/[chatId]/messages` – Send message (body: `{ content?: string; media_urls?: string[] }`)
- `POST /api/chats/upload` – Upload chat image (multipart form-data), returns `{ url: string }`
- `POST /api/chats/[chatId]/read` – Mark as read
