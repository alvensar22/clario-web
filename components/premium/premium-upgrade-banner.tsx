'use client';

import { useState } from 'react';
import { PremiumUpgradeModal } from './premium-upgrade-modal';
import { Button } from '@/components/ui/button';

export function PremiumUpgradeBanner() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="border-t border-neutral-800/60 bg-gradient-to-br from-purple-900/20 to-pink-900/20 px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-lg font-semibold text-white">
              You've reached your daily limit
            </h3>
            <p className="mb-4 text-sm text-neutral-400">
              Upgrade to Premium to see unlimited posts in My Interests and unlock exclusive features.
            </p>
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = '/premium';
              }}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
      <PremiumUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
