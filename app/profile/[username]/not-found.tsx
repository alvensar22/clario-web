import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          404
        </h1>
        <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-400">
          User not found
        </p>
        <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-500">
          The profile you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
