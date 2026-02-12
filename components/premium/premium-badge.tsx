'use client';

interface PremiumBadgeProps {
  /** Size: 'sm' for inline/text, 'md' for nav, 'lg' for profile */
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

export function PremiumBadge({ size = 'md', className = '', ariaLabel = 'Premium' }: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-pink-500 text-white ${className}`}
      aria-label={ariaLabel}
      title="Premium"
    >
      <svg
        className={sizeClasses[size]}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm10 10a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
