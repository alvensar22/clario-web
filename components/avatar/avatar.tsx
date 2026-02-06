import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-24 w-24 text-lg',
  xl: 'h-32 w-32 text-xl',
};

export function Avatar({
  src,
  alt = 'Avatar',
  size = 'md',
  className,
  fallback,
}: AvatarProps) {
  const initials = fallback
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="rounded-full object-cover"
          sizes={`${size === 'sm' ? '32' : size === 'md' ? '40' : size === 'lg' ? '96' : '128'}px`}
        />
      ) : (
        <span className="font-medium">{initials || '?'}</span>
      )}
    </div>
  );
}
