'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { ApiPost } from '@/lib/api/types';
import { PostEditModal } from './post-edit-modal';

interface PostCardMenuProps {
  post: ApiPost;
  variant?: 'feed' | 'profile';
  onDelete?: (postId: string) => void;
  onEditSuccess?: () => void;
}

export function PostCardMenu({
  post,
  variant = 'feed',
  onDelete,
  onEditSuccess,
}: PostCardMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isProfile = variant === 'profile';
  const buttonClass =
    'rounded-full p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    (isProfile
      ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 focus-visible:ring-neutral-400'
      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white focus-visible:ring-white focus-visible:ring-offset-black');
  const dropdownClass =
    'absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border py-1 shadow-lg ' +
    (isProfile
      ? 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
      : 'border-neutral-700 bg-neutral-900');
  const itemClass =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ' +
    (isProfile
      ? 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
      : 'text-neutral-200 hover:bg-neutral-800');

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  const handleDelete = useCallback(async () => {
    setOpen(false);
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    const res = await api.deletePost(post.id);
    setDeleting(false);
    if (!res.error) {
      onDelete?.(post.id);
      router.refresh();
    }
  }, [post.id, onDelete, router]);

  const handleEdit = useCallback(() => {
    setOpen(false);
    setEditOpen(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditOpen(false);
    onEditSuccess?.();
    router.refresh();
  }, [onEditSuccess, router]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={buttonClass}
        aria-label="Post options"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className={dropdownClass}>
          <button type="button" onClick={handleEdit} className={itemClass}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={itemClass + ' text-red-500 hover:bg-red-500/10 disabled:opacity-50'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      )}
      {editOpen && (
        <PostEditModal
          post={post}
          variant={variant}
          onClose={() => setEditOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
