'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumUpgradeModal({ isOpen, onClose }: PremiumUpgradeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      aria-modal
      aria-labelledby="premium-modal-title"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-black p-6 shadow-xl sm:p-8"
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 id="premium-modal-title" className="mb-2 text-center text-2xl font-bold text-white">
          Upgrade to Premium
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-neutral-400">
          You've reached your daily limit of 5 posts in My Interests. Upgrade to Premium to see unlimited posts and unlock exclusive features.
        </p>

        {/* Features */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Unlimited posts in My Interests feed</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Priority support</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Exclusive premium badges</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              // TODO: Implement premium upgrade flow
              console.log('Upgrade to premium');
              onClose();
            }}
          >
            Upgrade to Premium
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
