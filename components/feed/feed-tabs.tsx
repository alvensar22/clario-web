'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export type FeedTab = 'following' | 'interests' | 'explore';

const TABS: { value: FeedTab; label: string }[] = [
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
  { value: 'explore', label: 'Explore' },
];

interface FeedTabsProps {
  className?: string;
}

/**
 * Minimal pill toggle: Following | My Interests | Explore.
 * Uses URL search param ?tab= for active state and navigation.
 */
export function FeedTabs({ className = '' }: FeedTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get('tab') as FeedTab) ?? 'explore';
  const base = pathname ?? '/feed';

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-neutral-800 bg-neutral-900/50 p-0.5 ${className}`}
      role="tablist"
      aria-label="Feed"
    >
      {TABS.map((tab) => {
        const isActive = current === tab.value;
        const href = tab.value === 'explore' ? base : `${base}?tab=${tab.value}`;
        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`
              relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
              ${isActive ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
