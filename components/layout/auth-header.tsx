import Link from 'next/link';

const LogoIcon = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export { LogoIcon };

interface AuthHeaderProps {
  /** Content to render on the right side (e.g. Log in / Sign up links or buttons) */
  rightContent?: React.ReactNode;
}

export function AuthHeader({ rightContent }: AuthHeaderProps) {
  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <LogoIcon className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">clario</span>
        </Link>
        {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
      </div>
    </header>
  );
}
