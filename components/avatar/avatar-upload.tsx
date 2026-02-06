'use client';

import { uploadAvatar, deleteAvatar } from '@/app/actions/avatar';
import { useActionState, useRef, useState, useEffect, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar/avatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadComplete?: (avatarUrl: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadAvatar,
    null
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteAvatar,
    null
  );
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadState && 'success' in uploadState && uploadState.success && 'avatarUrl' in uploadState) {
      setPreview(uploadState.avatarUrl);
      setLocalError(null);
      onUploadComplete?.(uploadState.avatarUrl);
    }
  }, [uploadState, onUploadComplete]);

  useEffect(() => {
    if (deleteState && 'success' in deleteState && deleteState.success) {
      setPreview(null);
      setLocalError(null);
      onUploadComplete?.('');
    }
  }, [deleteState, onUploadComplete]);

  // Clear local error when upload state changes
  useEffect(() => {
    if (uploadState && 'message' in uploadState) {
      setLocalError(null);
    }
  }, [uploadState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setLocalError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLocalError('Please select an image file');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setLocalError(`Image size (${fileSizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      setLocalError('Failed to read image file');
    };
    reader.readAsDataURL(file);

    // Submit form with startTransition to properly handle async action
    const formData = new FormData();
    formData.append('avatar', file);
    startTransition(async () => {
      try {
        await uploadAction(formData);
      } catch (error) {
        // Handle network/body size errors that occur before server action runs
        if (
          error instanceof Error &&
          (error.message.includes('Body exceeded') ||
            error.message.includes('413') ||
            error.message.includes('bodySizeLimit'))
        ) {
          setLocalError(
            'File size exceeds the 5MB limit. Please choose a smaller image.'
          );
        } else {
          setLocalError('Failed to upload image. Please try again.');
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar src={preview || undefined} size="lg" />
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || isDeleting}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="text-sm"
          >
            {preview ? 'Change' : 'Upload'}
          </Button>

          {preview && (
            <form action={deleteAction}>
              <Button
                type="submit"
                variant="ghost"
                disabled={isUploading || isDeleting}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to remove your avatar?')) {
                    e.preventDefault();
                  }
                }}
              >
                Remove
              </Button>
            </form>
          )}
        </div>
      </div>

      {(localError || (uploadState && 'message' in uploadState && !('success' in uploadState))) && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {localError || (uploadState && 'message' in uploadState ? uploadState.message : '')}
        </div>
      )}
      {deleteState && 'message' in deleteState && !('success' in deleteState) && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {deleteState.message}
        </div>
      )}
    </div>
  );
}
