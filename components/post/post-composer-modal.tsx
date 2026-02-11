'use client';

import { useEffect, useRef } from 'react';
import type { ApiInterest } from '@/lib/api/types';
import { PostComposer } from './post-composer';

interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; avatar_url: string | null };
  interests: ApiInterest[];
  onSuccess?: () => void;
}

export function PostComposerModal({
  isOpen,
  onClose,
  currentUser,
  interests,
  onSuccess,
}: PostComposerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      aria-modal
      aria-labelledby="modal-title"
      role="dialog"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-2xl border-t border-neutral-800 bg-black sm:rounded-2xl sm:border sm:border-neutral-800"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-4 sm:px-6">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            New post
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative overflow-y-auto px-4 py-4 sm:px-6" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          <PostComposer
            currentUser={currentUser}
            interests={interests}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
