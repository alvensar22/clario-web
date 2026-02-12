'use client';

import { useNotifications } from './notification-provider';

interface NotificationBellProps {
  className?: string;
}

/** Icon with unread badge. Wrap in Link or use as child of nav item. */
export function NotificationBell({ className }: NotificationBellProps) {
  const ctx = useNotifications();
  const count = ctx?.unreadCount ?? null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      aria-label={count != null && count > 0 ? `${count} unread notifications` : 'Notifications'}
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
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
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
