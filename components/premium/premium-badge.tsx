'use client';

import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  /** Size: 'sm' for post card, 'md' for nav (unused if using PremiumPill in nav), 'lg' for profile */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/** Golden crown icon – use on post cards and profile */
export function PremiumBadge({ size = 'md', className = '', ariaLabel = 'Premium' }: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-amber-400 ${className}`}
      aria-label={ariaLabel}
      title="Premium"
    >
      <Crown className={sizeClasses[size]} strokeWidth={2} aria-hidden />
    </span>
  );
}

/** Word "Premium" with rounded outline – use in side nav for premium feel */
export function PremiumPill({ className = '' }: { className?: string }) {
  return (
    <span
      className={
        `inline-flex shrink-0 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)] ${className}`
      }
      aria-label="Premium member"
      title="Premium member"
    >
      Premium
    </span>
  );
}
