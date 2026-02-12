'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
  /** Single image (legacy) */
  src?: string;
  /** Multiple images; use with initialIndex for gallery. Takes precedence over src. */
  images?: string[];
  /** Index to show first when using images[]. */
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
}

export function ImagePreview({
  src,
  images: imagesProp,
  initialIndex = 0,
  alt = '',
  onClose,
}: ImagePreviewProps) {
  const images = imagesProp?.length
    ? imagesProp
    : src
      ? [src]
      : [];
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1))
  );

  const currentSrc = images[currentIndex];
  const hasMultiple = images.length > 1;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleArrow = (e: KeyboardEvent) => {
      if (!hasMultiple) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleArrow);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrow);
    };
  }, [onClose, hasMultiple, images.length]);

  if (!currentSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
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

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
            }}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/80 text-white transition-colors hover:bg-neutral-700"
            aria-label="Previous image"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
            }}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/80 text-white transition-colors hover:bg-neutral-700"
            aria-label="Next image"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative max-h-[90vh] max-w-[90vw] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={currentSrc}
          alt={alt}
          width={1200}
          height={800}
          className="h-auto max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
          unoptimized={currentSrc.includes('supabase')}
          priority
        />
        {hasMultiple && (
          <p className="mt-2 text-center text-sm text-neutral-400">
            {currentIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}
