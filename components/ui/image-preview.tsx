'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImagePreview({ src, alt = '', onClose }: ImagePreviewProps) {
  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800/80 text-white transition-colors hover:bg-neutral-700"
        aria-label="Close preview"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image container */}
      <div
        className="relative max-h-[90vh] max-w-[90vw] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className="h-auto max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
          unoptimized={src.includes('supabase')}
          priority
        />
      </div>
    </div>
  );
}
