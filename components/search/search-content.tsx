'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import type { ApiSearchResult, ApiSearchUser, ApiInterest, ApiPost } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { RelativeTime } from '@/components/ui/relative-time';
import { Input } from '@/components/ui/input';

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 1;

export function SearchContent() {
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(qFromUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>('');

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResult({ users: [], interests: [], posts: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.search(trimmed);
    setLoading(false);
    if (err) {
      setError(err);
      setResult(null);
      return;
    }
    setResult(data ?? { users: [], interests: [], posts: [] });
    lastQueryRef.current = trimmed;
  }, []);

  // Sync input from URL when URL changes (e.g. browser back)
  useEffect(() => {
    setInputValue(qFromUrl);
  }, [qFromUrl]);

  // When URL q changes, run search
  useEffect(() => {
    const trimmed = qFromUrl.trim();
    if (trimmed.length >= MIN_QUERY_LENGTH) {
      if (trimmed !== lastQueryRef.current) runSearch(trimmed);
    } else {
      setResult(null);
      lastQueryRef.current = '';
    }
  }, [qFromUrl, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', value);
    window.history.replaceState(null, '', `?${params.toString()}`);
    runSearch(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < MIN_QUERY_LENGTH) {
      setResult(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', v.trim());
      window.history.replaceState(null, '', `?${params.toString()}`);
      runSearch(v.trim());
    }, DEBOUNCE_MS);
  };

  const hasQuery = (qFromUrl?.trim().length ?? 0) >= MIN_QUERY_LENGTH;
  const hasResults = result && (result.users.length > 0 || result.interests.length > 0 || result.posts.length > 0);
  const emptyAfterSearch = hasQuery && result && !hasResults && !loading;

  return (
    <div className="min-h-[60vh] px-4 py-6">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <Input
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Search people, topics, posts..."
            className="border-neutral-700 bg-neutral-900/80 pl-10 text-white placeholder:text-neutral-500 focus:ring-neutral-600"
            autoFocus
            aria-label="Search"
          />
        </div>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
        </div>
      )}

      {!loading && emptyAfterSearch && (
        <p className="text-center text-neutral-400">No results for &quot;{qFromUrl.trim()}&quot;</p>
      )}

      {!loading && hasResults && result && (
        <div className="space-y-10">
          {result.users.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">People</h2>
              <ul className="space-y-1">
                {result.users.map((u) => (
                  <UserResult key={u.id} user={u} />
                ))}
              </ul>
            </section>
          )}
          {result.interests.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Topics</h2>
              <ul className="space-y-1">
                {result.interests.map((i) => (
                  <InterestResult key={i.id} interest={i} />
                ))}
              </ul>
            </section>
          )}
          {result.posts.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Posts</h2>
              <ul className="divide-y divide-neutral-800/80">
                {result.posts.map((post) => (
                  <PostResult key={post.id} post={post} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!loading && !hasQuery && (
        <p className="text-center text-neutral-500">Enter a search term to find people, topics, and posts.</p>
      )}
    </div>
  );
}

function UserResult({ user }: { user: ApiSearchUser }) {
  const username = user.username ?? 'unknown';
  return (
    <li>
      <Link
        href={`/profile/${username}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-900/80"
      >
        <Avatar src={user.avatar_url ?? undefined} fallback={username} size="md" />
        <span className="font-medium text-white">@{username}</span>
      </Link>
    </li>
  );
}

function InterestResult({ interest }: { interest: ApiInterest }) {
  return (
    <li>
      <Link
        href="/feed"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-900/80"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-lg text-neutral-300">
          #
        </span>
        <span className="font-medium text-white">{interest.name}</span>
      </Link>
    </li>
  );
}

function PostResult({ post }: { post: ApiPost }) {
  const username = post.author?.username ?? 'unknown';
  const contentSnippet = post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content;
  return (
    <li>
      <Link
        href={`/post/${post.id}`}
        className="block px-3 py-3 transition-colors hover:bg-neutral-900/40"
      >
        <div className="flex gap-3">
          <Avatar
            src={post.author?.avatar_url ?? undefined}
            fallback={username}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]">
              <span className="font-medium text-white">@{username}</span>
              <span className="text-neutral-500">·</span>
              <RelativeTime isoDate={post.created_at} className="text-neutral-500" />
              {post.interest?.name && (
                <>
                  <span className="text-neutral-500">·</span>
                  <span className="rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-xs text-neutral-400">
                    {post.interest.name}
                  </span>
                </>
              )}
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-300">{contentSnippet}</p>
            {(post.like_count !== undefined && post.like_count > 0) || (post.comment_count !== undefined && post.comment_count > 0) ? (
              <p className="mt-1 text-xs text-neutral-500">
                {post.like_count ?? 0} likes · {post.comment_count ?? 0} comments
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
