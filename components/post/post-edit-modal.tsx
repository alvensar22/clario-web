'use client';

import { api } from '@/lib/api/client';
import type { ApiInterest, ApiPost } from '@/lib/api/types';
import { useCallback, useEffect, useState } from 'react';

interface PostEditModalProps {
  post: ApiPost;
  variant?: 'feed' | 'profile';
  onClose: () => void;
  onSuccess: () => void;
}

export function PostEditModal({
  post,
  variant = 'feed',
  onClose,
  onSuccess,
}: PostEditModalProps) {
  const [content, setContent] = useState(post.content);
  const [interestId, setInterestId] = useState<string | null>(post.interest_id ?? null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(post.media_url ?? null);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfile = variant === 'profile';

  useEffect(() => {
    api.getInterests().then((res) => {
      if (res.data) setInterests(res.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = content.trim();
      if (!trimmed) {
        setError('Content is required');
        return;
      }
      setError(null);
      setSaving(true);
      const res = await api.updatePost(post.id, {
        content: trimmed,
        interest_id: interestId ?? null,
        media_url: mediaUrl ?? null,
      });
      setSaving(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSuccess();
    },
    [post.id, content, interestId, mediaUrl, onSuccess]
  );

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center p-4 ' +
    (isProfile ? 'bg-black/50' : 'bg-black/70');
  const panelClass =
    'w-full max-w-md rounded-xl border shadow-xl ' +
    (isProfile
      ? 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
      : 'border-neutral-700 bg-neutral-900');
  const inputClass =
    'w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 ' +
    (isProfile
      ? 'border-neutral-200 dark:border-neutral-600 focus:ring-neutral-400 dark:focus:ring-neutral-500'
      : 'border-neutral-600 bg-neutral-800/50 text-white focus:ring-neutral-500');

  return (
    <div className={overlayClass} role="dialog" aria-modal="true" aria-labelledby="edit-post-title">
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 id="edit-post-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit post
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="edit-content" className="sr-only">
                Content
              </label>
              <textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={2000}
                className={inputClass}
                placeholder="What do you want to share?"
                required
              />
            </div>
            {mediaUrl && (
              <div className="relative inline-block">
                <img
                  src={mediaUrl}
                  alt=""
                  className="max-h-40 rounded-lg border border-neutral-600 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setMediaUrl(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {!loading && (
              <div>
                <label htmlFor="edit-interest" className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">
                  Interest
                </label>
                <select
                  id="edit-interest"
                  value={interestId ?? ''}
                  onChange={(e) => setInterestId(e.target.value || null)}
                  className={inputClass}
                >
                  <option value="">None</option>
                  {interests.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={
                'rounded-lg px-4 py-2 text-sm font-medium ' +
                (isProfile
                  ? 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  : 'text-neutral-300 hover:bg-neutral-800')
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={
                'rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ' +
                (isProfile
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                  : 'bg-white text-black hover:bg-neutral-200')
              }
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
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
