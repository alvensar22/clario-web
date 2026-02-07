import { FeedNav } from '@/components/feed/feed-nav';
import { FeedTabs } from '@/components/feed/feed-tabs';

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-black">
      <FeedNav theme="dark" />
      <div className="mx-auto max-w-xl border-x border-neutral-800">
        <div className="border-b border-neutral-800 px-4 py-4">
          <FeedTabs />
        </div>
        <div className="divide-y divide-neutral-800/80">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-800 animate-pulse" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-neutral-800 animate-pulse" />
                <div className="h-3 w-full max-w-md rounded bg-neutral-800/80 animate-pulse" />
                <div className="h-3 w-3/4 max-w-sm rounded bg-neutral-800/60 animate-pulse" />
                <div className="mt-4 flex gap-4">
                  <div className="h-4 w-12 rounded bg-neutral-800/60 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-neutral-800/60 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
