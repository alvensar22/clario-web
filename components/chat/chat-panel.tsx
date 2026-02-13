'use client';

import { useChat } from './chat-provider';
import { ChatConversation } from './chat-conversation';

/** Renders inline chat panels when chats are open (Facebook-style, multiple supported). */
export function ChatPanel() {
  const chatCtx = useChat();
  const openChats = chatCtx?.openChats ?? [];

  if (openChats.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-row items-end justify-end gap-2 overflow-x-auto">
      {openChats.map((chat, index) => (
        <ChatConversation
          key={chat.id}
          chatId={chat.id}
          otherUser={chat.other_user}
          initialUnreadCount={chat.unread_count}
          isFocused={index === openChats.length - 1}
          onFocus={() => chatCtx?.focusChat(chat.id)}
          onClose={() => chatCtx?.closeChat(chat.id)}
        />
      ))}
    </div>
  );
}
