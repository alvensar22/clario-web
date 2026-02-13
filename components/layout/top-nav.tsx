'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { NotificationBellWithDropdown } from '@/components/notifications/notification-dropdown';
import { Avatar } from '@/components/avatar/avatar';
import { api } from '@/lib/api/client';

export type FeedTab = 'explore' | 'following' | 'interests';

const FEED_OPTIONS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'For you' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

interface TopNavProps {
  /** When false/undefined, show premium badge on My Interests tab to indicate upgrade unlocks unlimited. */
  isPremium?: boolean;
  /** Current user username for profile link. Fetched client-side if not provided. */
  username?: string;
  /** Current user avatar URL. Fetched client-side if not provided. */
  avatarUrl?: string | null;
}

export function TopNav({ isPremium, username: usernameProp, avatarUrl: avatarUrlProp }: TopNavProps) {
  const [username, setUsername] = useState(usernameProp);
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlProp);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get('tab') as FeedTab) ?? 'explore';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = FEED_OPTIONS.find((opt) => opt.value === currentTab) ?? FEED_OPTIONS[0];
  const base = pathname ?? '/';

  useEffect(() => {
    if (typeof usernameProp !== 'undefined' && typeof avatarUrlProp !== 'undefined') return;
    api.getMe().then(({ data }) => {
      if (data?.username) setUsername(data.username);
      if (data?.avatar_url !== undefined) setAvatarUrl(data.avatar_url);
    });
  }, [usernameProp, avatarUrlProp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <header className="fixed left-56 right-0 top-0 z-30 border-b border-neutral-800/80 bg-black/90 backdrop-blur-xl">
      <div className="flex h-14 w-full items-center justify-between px-4">
        <div className="min-w-0 flex-1" />
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800/80"
          >
            <span className="flex items-center gap-1.5">
              {currentOption.label}
              {currentOption.value === 'interests' && !isPremium && (
                <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
              )}
            </span>
            <svg
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute left-1/2 top-full mt-1.5 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl">
              {FEED_OPTIONS.map((option) => {
                const href = option.value === 'explore' ? base : `${base}?tab=${option.value}`;
                const isActive = currentTab === option.value;
                return (
                  <Link
                    key={option.value}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[15px] transition-colors ${
                      isActive
                        ? 'bg-neutral-800/80 text-white font-medium'
                        : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {option.label}
                      {option.value === 'interests' && !isPremium && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
                      )}
                    </span>
                    {isActive && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <NotificationBellWithDropdown />
          {username && (
            <Link
              href={`/profile/${username}`}
              className="flex shrink-0 items-center rounded-full transition-opacity hover:opacity-90"
              aria-label="Your profile"
            >
              <Avatar src={avatarUrl ?? undefined} fallback={username} size="sm" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
