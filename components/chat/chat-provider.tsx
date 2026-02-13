'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import type { ApiChat } from '@/lib/api/types';

export const CHAT_NEW_MESSAGE_EVENT = 'chat:new-message';

interface ChatContextValue {
  chatUnreadCount: number | null;
  refreshChatUnreadCount: () => void;
  openChatId: string | null;
  openChatData: ApiChat | null;
  setOpenChatId: (id: string | null) => void;
  openChat: (chat: ApiChat) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatUnreadCount, setChatUnreadCount] = useState<number | null>(null);
  const [openChatId, setOpenChatIdState] = useState<string | null>(null);
  const [openChatData, setOpenChatData] = useState<ApiChat | null>(null);

  const refreshChatUnreadCount = useCallback(() => {
    api.getChatUnreadCount().then(({ data }) => {
      setChatUnreadCount(data?.count ?? 0);
    });
  }, []);

  const setOpenChatId = useCallback((id: string | null) => {
    setOpenChatIdState(id);
    if (!id) setOpenChatData(null);
  }, []);

  const openChat = useCallback((chat: ApiChat) => {
    setOpenChatIdState(chat.id);
    setOpenChatData(chat);
  }, []);

  const closeChat = useCallback(() => {
    setOpenChatIdState(null);
    setOpenChatData(null);
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
        openChatId,
        openChatData,
        setOpenChatId,
        openChat,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
