'use client';

import { useState, useEffect, useRef } from 'react';
import type { ApiPost } from '@/lib/api/types';
import type { FeedTab } from '@/components/layout/top-nav';
import { PostCard } from '@/components/post/post-card';
import { PremiumUpgradeModal } from '@/components/premium/premium-upgrade-modal';
import { PremiumUpgradeBanner } from '@/components/premium/premium-upgrade-banner';
import { useRouter } from 'next/navigation';

interface FeedListProps {
  posts: ApiPost[];
  currentUserId?: string | null;
  feedType?: FeedTab;
}

export function FeedList({ posts, currentUserId, feedType }: FeedListProps) {
  const router = useRouter();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasShownModalRef = useRef(false);

  // Show premium modal when scrolling to end of interests feed
  useEffect(() => {
    if (feedType !== 'interests' || posts.length < 5 || hasShownModalRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasShownModalRef.current) {
            setShowPremiumModal(true);
            hasShownModalRef.current = true;
          }
        });
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [feedType, posts.length]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-neutral-500">No posts yet.</p>
        <p className="mt-1 text-sm text-neutral-600">Be the first to share something.</p>
      </div>
    );
  }

  const isInterestsFeed = feedType === 'interests';
  const showSentinel = isInterestsFeed && posts.length >= 5;
  const showBanner = isInterestsFeed && posts.length >= 5;

  return (
    <>
      <ul className="divide-y divide-neutral-800/60">
        {posts.map((post, index) => (
          <li key={post.id}>
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onDelete={() => router.refresh()}
              priority={index === 0}
            />
          </li>
        ))}
        {showSentinel && (
          <li>
            <div ref={sentinelRef} className="h-1" />
          </li>
        )}
        {showBanner && (
          <li>
            <PremiumUpgradeBanner />
          </li>
        )}
      </ul>
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}
