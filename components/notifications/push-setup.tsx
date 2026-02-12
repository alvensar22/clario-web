'use client';

import { usePushSubscription } from '@/hooks/use-push-subscription';
import { useEffect } from 'react';

/**
 * Registers the service worker for push. Call once when app loads.
 */
export function PushSetup() {
  const { permission, requestPermission } = usePushSubscription();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}

/**
 * Inline prompt to enable push notifications. Use on notifications page.
 */
export function PushEnablePrompt() {
  const { permission, requestPermission, loading } = usePushSubscription();

  if (permission === 'granted' || permission === 'unsupported') return null;

  return (
    <div className="mx-4 mb-4 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
      <p className="text-sm text-neutral-300">
        Enable push notifications to get alerts when someone likes, comments, or follows you.
      </p>
      <button
        type="button"
        onClick={requestPermission}
        disabled={loading || permission === 'denied'}
        className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Enabling…' : permission === 'denied' ? 'Blocked' : 'Enable notifications'}
      </button>
    </div>
  );
}
