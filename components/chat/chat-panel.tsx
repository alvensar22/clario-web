'use client';

import { useChat } from './chat-provider';
import { ChatConversation } from './chat-conversation';

/** Renders the inline chat panel when a chat is open (Facebook-style). */
export function ChatPanel() {
  const chatCtx = useChat();
  const openChatId = chatCtx?.openChatId ?? null;
  const openChatData = chatCtx?.openChatData ?? null;

  if (!openChatId || !openChatData) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <ChatConversation
        chatId={openChatId}
        otherUser={openChatData.other_user}
        onClose={() => chatCtx?.closeChat()}
      />
    </div>
  );
}
