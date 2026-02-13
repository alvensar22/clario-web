'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api/client';
import type { ApiChat } from '@/lib/api/types';

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

  useEffect(() => {
    const interval = setInterval(refreshChatUnreadCount, 15000);
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
