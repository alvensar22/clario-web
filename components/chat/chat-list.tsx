'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useChat, CHAT_NEW_MESSAGE_EVENT } from './chat-provider';
import type { ApiChat } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { formatRelativeTime } from '@/lib/utils';

const PAGE_SIZE = 20;

interface ChatListProps {
  initialChats: ApiChat[];
  initialHasMore: boolean;
}

export function ChatList({ initialChats, initialHasMore }: ChatListProps) {
  const [chats, setChats] = useState<ApiChat[]>(initialChats);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const chatCtx = useChat();

  const refresh = useCallback(async () => {
    const { data } = await api.getChats(PAGE_SIZE, 0);
    if (data?.chats) {
      setChats(data.chats);
    }
    setHasMore(data?.hasMore ?? false);
    chatCtx?.refreshChatUnreadCount();
  }, [chatCtx]);

  // Realtime: refresh when new messages arrive
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(CHAT_NEW_MESSAGE_EVENT, handler);
    return () => window.removeEventListener(CHAT_NEW_MESSAGE_EVENT, handler);
  }, [refresh]);

  // Fallback polling in case Realtime disconnects
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const { data } = await api.getChats(PAGE_SIZE, chats.length);
    setLoading(false);
    if (data?.chats?.length) {
      setChats((prev) => [...prev, ...data.chats]);
    }
    setHasMore(data?.hasMore ?? false);
  }, [chats.length, hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  const handleStartChat = useCallback(async () => {
    const username = newUsername.trim().replace(/^@/, '');
    if (!username) {
      setNewError('Enter a username');
      return;
    }

    setStarting(true);
    setNewError(null);
    const { data: user, error: userError } = await api.getUserByUsername(username);
    setStarting(false);

    if (userError || !user?.id) {
      setNewError('User not found');
      return;
    }

    const { data: chatRes, error: chatError } = await api.createOrGetChat(user.id);
    if (chatError || !chatRes?.chatId) {
      setNewError('Could not start chat');
      return;
    }

    const newChat: ApiChat = {
      id: chatRes.chatId,
      other_user: { id: user.id, username: user.username, avatar_url: user.avatar_url },
      last_message: null,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    setChats((prev) => {
      const existing = prev.find((c) => c.id === newChat.id);
      if (existing) return prev;
      return [newChat, ...prev];
    });
    chatCtx?.openChat(newChat);
    setNewUsername('');
  }, [newUsername, chatCtx]);

  return (
    <>
      <div className="border-b border-neutral-800/80 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
            placeholder="Start chat with @username"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <button
            type="button"
            onClick={handleStartChat}
            disabled={starting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-blue-500 disabled:opacity-50"
          >
            {starting ? 'Starting…' : 'Message'}
          </button>
        </div>
        {newError && <p className="mt-2 text-sm text-red-400">{newError}</p>}
      </div>

      {chats.length === 0 ? (
        <div className="px-4 py-12 text-center text-neutral-400">
          <p>No chats yet.</p>
          <p className="mt-1 text-sm">Enter a username above to start a conversation.</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-800/80">
          {chats.map((chat) => {
            const name = chat.other_user.username ?? 'Unknown';
            const preview = chat.last_message
              ? (chat.last_message.sender_id === chat.other_user.id ? '' : 'You: ') + chat.last_message.content
              : 'No messages yet';
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => chatCtx?.openChat(chat)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-800/80"
                >
                  <Avatar
                    src={chat.other_user.avatar_url ?? undefined}
                    fallback={name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-white">@{name}</span>
                      {chat.last_message && (
                        <span className="shrink-0 text-xs text-neutral-500">
                          {formatRelativeTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-neutral-400">{preview}</p>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden>
          {loading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          )}
        </div>
      )}
    </>
  );
}
