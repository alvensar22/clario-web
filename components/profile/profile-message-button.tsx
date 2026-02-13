'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { useChat } from '@/components/chat/chat-provider';
import type { ApiChat } from '@/lib/api/types';
import { Button } from '@/components/ui/button';

interface ProfileMessageButtonProps {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
}

export function ProfileMessageButton({ userId, username, avatarUrl }: ProfileMessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const chatCtx = useChat();

  const handleClick = async () => {
    if (!chatCtx || loading) return;

    setLoading(true);
    const { data: chatRes, error } = await api.createOrGetChat(userId);
    setLoading(false);

    if (error || !chatRes?.chatId) return;

    const chat: ApiChat = {
      id: chatRes.chatId,
      other_user: { id: userId, username, avatar_url: avatarUrl },
      last_message: null,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    chatCtx.openChat(chat);
  };

  return (
    <Button
      variant="secondary"
      className="w-full sm:w-auto"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Opening…' : 'Message'}
    </Button>
  );
}
