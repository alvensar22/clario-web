'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import type { ApiChat } from '@/lib/api/types';

export const CHAT_NEW_MESSAGE_EVENT = 'chat:new-message';

const MAX_OPEN_CHATS = 5;

interface ChatContextValue {
  chatUnreadCount: number | null;
  refreshChatUnreadCount: () => void;
  openChats: ApiChat[];
  openChat: (chat: ApiChat) => void;
  closeChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatUnreadCount, setChatUnreadCount] = useState<number | null>(null);
  const [openChats, setOpenChats] = useState<ApiChat[]>([]);

  const refreshChatUnreadCount = useCallback(() => {
    api.getChatUnreadCount().then(({ data }) => {
      setChatUnreadCount(data?.count ?? 0);
    });
  }, []);

  const openChat = useCallback((chat: ApiChat) => {
    setOpenChats((prev) => {
      const existing = prev.filter((c) => c.id !== chat.id);
      const updated = [...existing, chat];
      return updated.slice(-MAX_OPEN_CHATS);
    });
  }, []);

  const closeChat = useCallback((chatId: string) => {
    setOpenChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  useEffect(() => {
    refreshChatUnreadCount();
  }, [refreshChatUnreadCount]);

  // Realtime: new messages → update unread count and notify chat list/dropdown
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('chat-provider')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          () => {
            refreshChatUnreadCount();
            window.dispatchEvent(new CustomEvent(CHAT_NEW_MESSAGE_EVENT));
          }
        )
        .subscribe();

      refreshChatUnreadCount();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshChatUnreadCount]);

  // Fallback polling in case Realtime disconnects
  useEffect(() => {
    const interval = setInterval(refreshChatUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshChatUnreadCount]);

  return (
    <ChatContext.Provider
      value={{
        chatUnreadCount,
        refreshChatUnreadCount,
        openChats,
        openChat,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
