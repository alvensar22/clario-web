'use client';

import { api } from '@/lib/api/client';
import type { ApiFollowListUser } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export type FollowListMode = 'followers' | 'following';

interface FollowListModalProps {
  username: string;
  mode: FollowListMode;
  onClose: () => void;
}

export function FollowListModal({ username, mode, onClose }: FollowListModalProps) {
  const [users, setUsers] = useState<ApiFollowListUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = mode === 'followers' ? await api.getFollowers(username) : await api.getFollowing(username);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setUsers(res.data?.users ?? []);
  }, [username, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const title = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-list-title"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <h2 id="follow-list-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-600 dark:border-t-neutral-400" />
            </div>
          ) : error ? (
            <p className="px-4 py-6 text-sm text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/profile/${u.username ?? ''}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <Avatar
                      src={u.avatar_url ?? undefined}
                      fallback={u.username ?? '?'}
                      size="md"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900 dark:text-neutral-100">
                      @{u.username ?? 'unknown'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close"
      />
    </div>
  );
}
