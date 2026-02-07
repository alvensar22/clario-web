'use client';

import { api } from '@/lib/api/client';
import type { ApiComment } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { useCallback, useEffect, useState } from 'react';

interface PostCommentsProps {
  postId: string;
  variant?: 'feed' | 'profile';
}

export function PostComments({ postId, variant = 'feed' }: PostCommentsProps) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getComments(postId);
    setLoading(false);
    if (res.data?.comments) setComments(res.data.comments);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async () => {
    const text = content.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    const res = await api.addComment(postId, text);
    setSubmitting(false);
    if (res.data) {
      setComments((prev) => [...prev, res.data!]);
      setContent('');
    }
  }, [postId, content, submitting]);

  const isProfile = variant === 'profile';
  const inputClass =
    'w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors ' +
    (isProfile
      ? 'border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500'
      : 'border-neutral-700 bg-neutral-900/50 focus:ring-2 focus:ring-neutral-500');
  const authorClass = isProfile
    ? 'font-medium text-neutral-900 dark:text-neutral-100'
    : 'font-medium text-white';

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? '…' : 'Post'}
        </button>
      </form>
      {loading ? (
        <p className="text-sm text-neutral-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Avatar
                src={c.author?.avatar_url ?? undefined}
                fallback={c.author?.username ?? '?'}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <span className={authorClass}>@{c.author?.username ?? 'unknown'}</span>
                <p className={`mt-0.5 whitespace-pre-wrap text-sm ${isProfile ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-300'}`}>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
