'use client';

const TABS = [
  { label: 'For You', slug: 'for-you' },
  { label: 'Following', slug: 'following' },
  { label: 'My Interests', slug: 'my-interests' },
] as const;

/**
 * Feed top nav: For You | Following | My Interests.
 * UI only — no routing or logic yet.
 */
export function FeedNav() {
  const activeSlug = 'for-you';

  return (
    <nav
      className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-backdrop-filter:dark:bg-neutral-950/80"
      aria-label="Feed"
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const isActive = activeSlug === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              disabled
              className="relative flex flex-1 items-center justify-center py-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-100 disabled:pointer-events-none"
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={
                  isActive
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-400'
                }
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
