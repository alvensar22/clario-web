'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useChat, CHAT_NEW_MESSAGE_EVENT } from './chat-provider';
import type { ApiChat } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { ChatIcon } from './chat-icon';
import { formatRelativeTime } from '@/lib/utils';

const DROPDOWN_LIMIT = 20;

interface ChatDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatDropdown({ isOpen, onClose, anchorRef }: ChatDropdownProps) {
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(false);
  const chatCtx = useChat();

  const fetchChats = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getChats(DROPDOWN_LIMIT, 0);
    setLoading(false);
    if (data?.chats) {
      setChats(data.chats);
    }
    chatCtx?.refreshChatUnreadCount();
  }, [chatCtx]);

  useEffect(() => {
    if (isOpen) fetchChats();
  }, [isOpen, fetchChats]);

  // Realtime: refresh when new messages arrive (e.g. dropdown is open)
  useEffect(() => {
    const handler = () => {
      if (isOpen) fetchChats();
    };
    window.addEventListener(CHAT_NEW_MESSAGE_EVENT, handler);
    return () => window.removeEventListener(CHAT_NEW_MESSAGE_EVENT, handler);
  }, [isOpen, fetchChats]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleChatClick = useCallback((chat: ApiChat) => {
    chatCtx?.openChat(chat);
    onClose();
  }, [chatCtx, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
      <div className="border-b border-neutral-800/80 px-4 py-3">
        <h2 className="text-base font-semibold text-white">Messages</h2>
      </div>
      <div className="max-h-[320px] overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            No chats yet. Start a conversation from a profile.
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
                    onClick={() => handleChatClick(chat)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-800/80"
                  >
                    <Avatar
                      src={chat.other_user.avatar_url ?? undefined}
                      fallback={name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">@{name}</span>
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
      </div>
      <div className="border-t border-neutral-800/80 p-2">
        <Link
          href="/chats"
          onClick={onClose}
          className="block w-full rounded-lg py-2.5 text-center text-sm font-medium text-blue-400 transition-colors hover:bg-neutral-800/80 hover:text-blue-300"
        >
          See all chats
        </Link>
      </div>
    </div>
  );
}

export function ChatIconWithDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-neutral-800/80"
        aria-label="Messages"
        aria-expanded={isOpen}
      >
        <ChatIcon />
      </button>
      <ChatDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={anchorRef}
      />
    </div>
  );
}
