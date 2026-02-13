'use client';

import { useChat } from './chat-provider';

interface ChatIconProps {
  className?: string;
}

/** Chat icon with unread badge. */
export function ChatIcon({ className }: ChatIconProps) {
  const ctx = useChat();
  const count = ctx?.chatUnreadCount ?? null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      aria-label={count != null && count > 0 ? `${count} unread messages` : 'Chat'}
    >
      <svg
        className="h-6 w-6 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {count != null && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  );
}
