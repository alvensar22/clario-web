'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export type FeedTab = 'explore' | 'following' | 'interests';

const TABS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'Explore' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

type Theme = 'light' | 'dark';

interface FeedNavProps {
  /** 'dark' for black feed page, 'light' for home */
  theme?: Theme;
}

/**
 * Feed top nav: Threads-inspired minimal design with functional tab switching
 */
export function FeedNav({ theme = 'light' }: FeedNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as FeedTab) ?? 'explore';
  const base = pathname ?? '/';

  return (
    <nav 
      className="sticky top-0 z-50 border-b border-neutral-800/80 bg-black/80 backdrop-blur-xl" 
      aria-label="Feed"
    >
      <div className="mx-auto max-w-2xl">
        {/* Logo Section */}
        <div className="flex items-center justify-center border-b border-neutral-800/50 px-4 py-3">
          <Link 
            href="/" 
            className="text-xl font-bold text-white hover:text-neutral-300 transition-colors"
          >
            clario
          </Link>
        </div>

        {/* Tabs Section */}
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-1 -mx-2">
            {TABS.map((tab) => {
              const isActive = currentTab === tab.value;
              const href = tab.value === 'explore' ? base : `${base}?tab=${tab.value}`;
              return (
                <Link
                  key={tab.value}
                  href={href}
                  className="relative flex flex-1 items-center justify-center py-3.5 px-2 text-sm font-semibold transition-colors"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>
          <Link
            href="/create"
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-neutral-800/60"
            aria-label="Create post"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
