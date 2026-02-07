'use client';

import Link from 'next/link';

const TABS = [
  { label: 'For You', slug: 'for-you', href: '/feed' },
  { label: 'Following', slug: 'following', href: '/feed' },
  { label: 'My Interests', slug: 'my-interests', href: '/feed' },
] as const;

type Theme = 'light' | 'dark';

interface FeedNavProps {
  /** 'dark' for black feed page, 'light' for home */
  theme?: Theme;
}

/**
 * Feed top nav: For You | Following | My Interests.
 * Tabs are UI-only for now; Home and Create linked where relevant.
 */
export function FeedNav({ theme = 'light' }: FeedNavProps) {
  const activeSlug = 'for-you';
  const isDark = theme === 'dark';

  const navClass = isDark
    ? 'sticky top-0 z-10 border-b border-neutral-800 bg-black/95 backdrop-blur'
    : 'sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95';
  const activeText = isDark ? 'text-white' : 'text-neutral-900 dark:text-neutral-100';
  const inactiveText = isDark ? 'text-neutral-500' : 'text-neutral-500 dark:text-neutral-400';
  const indicatorClass = isDark ? 'bg-white' : 'bg-neutral-900 dark:bg-neutral-100';

  return (
    <nav className={navClass} aria-label="Feed">
      <div className="mx-auto flex max-w-2xl items-center">
        <div className="flex flex-1">
          {TABS.map((tab) => {
            const isActive = activeSlug === tab.slug;
            return (
              <Link
                key={tab.slug}
                href={tab.href}
                className={`relative flex flex-1 items-center justify-center py-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-100 ${inactiveText}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? activeText : undefined}>{tab.label}</span>
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full ${indicatorClass}`}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </div>
        <Link
          href="/create"
          className={
            isDark
              ? 'mr-4 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-600 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              : 'mr-4 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }
          aria-label="Create post"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
