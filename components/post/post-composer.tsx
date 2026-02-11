'use client';

import { api } from '@/lib/api/client';
import type { ApiInterest } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MAX_LENGTH = 500;
const TEXTAREA_MIN_ROWS = 1;
const TEXTAREA_MAX_ROWS = 8;

interface PostComposerProps {
  currentUser: { username: string; avatar_url: string | null };
  interests: ApiInterest[];
  /** When provided, called after successful post instead of redirecting to /feed */
  onSuccess?: () => void;
}

export function PostComposer({ currentUser, interests, onSuccess }: PostComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interestDropdownRef = useRef<HTMLDivElement>(null);
  const interestButtonRef = useRef<HTMLButtonElement>(null);

  // AI interest detection with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = content.trim();
    if (trimmed.length < 20) {
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setAiDetecting(true);
      try {
        const response = await fetch('/api/ai/detect-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.interest_id && data.confidence >= 0.6 && !interestId) {
            setInterestId(data.interest_id);
            setAiSuggested(true);
          }
        }
      } catch (err) {
        console.error('AI detection failed:', err);
      } finally {
        setAiDetecting(false);
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, interestId]);

  // Update dropdown position when it opens
  useEffect(() => {
    if (showInterestDropdown && interestButtonRef.current) {
      const rect = interestButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // mt-1 = 4px
        left: rect.left,
      });
    }
  }, [showInterestDropdown]);

  // Close interest dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        interestDropdownRef.current &&
        !interestDropdownRef.current.contains(e.target as Node) &&
        interestButtonRef.current &&
        !interestButtonRef.current.contains(e.target as Node)
      ) {
        setShowInterestDropdown(false);
      }
    };
    if (showInterestDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      // Close on resize to reposition
      const handleResize = () => {
        if (interestButtonRef.current) {
          const rect = interestButtonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showInterestDropdown]);

  // Auto-resize textarea (Threads-style single line that grows)
  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = 24;
    const minHeight = lineHeight * TEXTAREA_MIN_ROWS;
    const maxHeight = lineHeight * TEXTAREA_MAX_ROWS;
    const newHeight = Math.min(Math.max(ta.scrollHeight, minHeight), maxHeight);
    ta.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

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
    if (!trimmed || posting) return;
    setError(null);
    setPosting(true);
    const { error: err } = await api.createPost({
      content: trimmed,
      media_url: mediaUrl ?? undefined,
      interest_id: interestId ?? undefined,
    });
    if (err) {
      setError(err);
      setPosting(false);
      return;
    }
    // Success: clear form when staying on page (e.g. feed); redirect otherwise
    if (onSuccess) {
      setContent('');
      setMediaUrl(null);
      setInterestId(null);
      setAiSuggested(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = '24px';
      }
      onSuccess();
      router.refresh();
    } else {
      router.push('/feed');
      router.refresh();
    }
    setPosting(false);
  };

  const selectedInterest = interests.find((i) => i.id === interestId);
  const nearLimit = content.length >= MAX_LENGTH * 0.9;
  const atLimit = content.length >= MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="py-1">
      {/* Threads-style: avatar + single-line input that grows */}
      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          <Avatar
            src={currentUser.avatar_url ?? undefined}
            fallback={currentUser.username}
            size="md"
          />
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Start a thread..."
            rows={TEXTAREA_MIN_ROWS}
            maxLength={MAX_LENGTH}
            className="min-h-[24px] w-full resize-none overflow-y-auto border-0 bg-transparent text-[15px] leading-6 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            required
            onFocus={adjustTextareaHeight}
          />
          {mediaUrl && (
            <div className="relative mt-2 inline-block overflow-hidden rounded-xl">
              <img
                src={mediaUrl}
                alt="Upload"
                className="max-h-72 rounded-xl border border-neutral-800 object-cover"
              />
              <button
                type="button"
                onClick={() => setMediaUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black/90"
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

      {/* Toolbar: icon actions + interest + Post */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
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
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
            aria-label="Add photo"
          >
            {uploading ? (
              <span className="block h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            )}
          </button>

          {/* Interest: pill dropdown */}
          <div className="relative">
            <button
              ref={interestButtonRef}
              type="button"
              onClick={() => setShowInterestDropdown((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition-colors ${
                selectedInterest
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-400'
              }`}
            >
              {aiDetecting ? (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-400" />
                  <span>...</span>
                </span>
              ) : selectedInterest ? (
                <>
                  {aiSuggested && (
                    <svg className="h-3 w-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                  )}
                  <span>{selectedInterest.name}</span>
                </>
              ) : (
                <span>Topic</span>
              )}
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showInterestDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
              <div
                ref={interestDropdownRef}
                className="fixed z-[100] max-h-48 w-[180px] max-w-[calc(100vw-2rem)] overflow-auto rounded-xl border border-neutral-800 bg-neutral-950 py-1 shadow-xl"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setInterestId(null);
                    setAiSuggested(false);
                    setShowInterestDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  None
                </button>
                {interests.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      setInterestId(i.id);
                      setAiSuggested(false);
                      setShowInterestDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[13px] hover:bg-neutral-800 ${
                      interestId === i.id ? 'font-medium text-white' : 'text-neutral-400'
                    }`}
                  >
                    {i.name}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nearLimit && (
            <span className={`text-[12px] ${atLimit ? 'text-red-400' : 'text-neutral-500'}`}>
              {content.length}/{MAX_LENGTH}
            </span>
          )}
          <button
            type="submit"
            disabled={!content.trim() || posting}
            className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? (
              <>
                <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-neutral-400 border-t-black" />
                <span>Posting…</span>
              </>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-[13px] text-red-400">{error}</p>
      )}
    </form>
  );
}
