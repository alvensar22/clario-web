'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export type FeedTab = 'explore' | 'following' | 'interests';

const FEED_OPTIONS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'For you' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

export function TopNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get('tab') as FeedTab) ?? 'explore';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = FEED_OPTIONS.find((opt) => opt.value === currentTab) ?? FEED_OPTIONS[0];
  const base = pathname ?? '/';

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
    <header className="fixed left-20 right-0 top-0 z-30 border-b border-neutral-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Empty left side for balance */}
        <div className="w-32" />

        {/* Center: Logo */}
        <Link href="/" className="text-xl font-bold text-white hover:text-neutral-300 transition-colors">
          clario
        </Link>

        {/* Right: Feed Selector Dropdown */}
        <div className="relative w-32 flex justify-end" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/50 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {currentOption.label}
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
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl">
              {FEED_OPTIONS.map((option) => {
                const href = option.value === 'explore' ? base : `${base}?tab=${option.value}`;
                const isActive = currentTab === option.value;
                return (
                  <Link
                    key={option.value}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                    }`}
                  >
                    {option.label}
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
      </div>
    </header>
  );
}
