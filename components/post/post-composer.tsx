'use client';

import { api } from '@/lib/api/client';
import type { ApiCategory } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface PostComposerProps {
  currentUser: { username: string; avatar_url: string | null };
  categories: ApiCategory[];
}

export function PostComposer({ currentUser, categories }: PostComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image');
      return;
    }
    setError(null);
    setUploading(true);
    const { data, error: err } = await api.uploadPostImage(file);
    setUploading(false);
    if (err) {
      setError(err);
      return;
    }
    if (data?.url) setMediaUrl(data.url);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setError(null);
    setPosting(true);
    const { error: err } = await api.createPost({
      content: trimmed,
      media_url: mediaUrl ?? undefined,
      category_id: categoryId ?? undefined,
    });
    setPosting(false);
    if (err) {
      setError(err);
      return;
    }
    router.push('/feed');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          <Avatar
            src={currentUser.avatar_url ?? undefined}
            fallback={currentUser.username}
            size="md"
          />
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to share?"
            rows={4}
            maxLength={2000}
            className="w-full resize-none border-0 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            required
          />
          {mediaUrl && (
            <div className="relative mt-3 inline-block">
              <img
                src={mediaUrl}
                alt="Upload"
                className="max-h-64 rounded-lg border border-neutral-800 object-cover"
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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-800 pt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
          aria-label="Add image"
        >
          {uploading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-500 border-t-white" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          )}
        </button>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            type="submit"
            disabled={!content.trim() || posting}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
