'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ApiInterest } from '@/lib/api/types';
import { PostComposerModal } from './post-composer-modal';

interface PostComposerContextValue {
  openComposer: (user: { username: string; avatar_url: string | null }, interests: ApiInterest[], onSuccess?: () => void) => void;
  closeComposer: () => void;
}

const PostComposerContext = createContext<PostComposerContextValue | null>(null);

export function usePostComposer() {
  const ctx = useContext(PostComposerContext);
  if (!ctx) throw new Error('usePostComposer must be used within PostComposerProvider');
  return ctx;
}

interface PostComposerProviderProps {
  children: ReactNode;
}

export function PostComposerProvider({ children }: PostComposerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const openComposer = useCallback(
    (user: { username: string; avatar_url: string | null }, interestsList: ApiInterest[], onSuccess?: () => void) => {
      setCurrentUser(user);
      setInterests(interestsList);
      setOnSuccessCallback(() => onSuccess);
      setIsOpen(true);
    },
    []
  );

  const closeComposer = useCallback(() => {
    setIsOpen(false);
    setCurrentUser(null);
    setInterests([]);
    setOnSuccessCallback(undefined);
  }, []);

  return (
    <PostComposerContext.Provider value={{ openComposer, closeComposer }}>
      {children}
      {currentUser && (
        <PostComposerModal
          isOpen={isOpen}
          onClose={closeComposer}
          currentUser={currentUser}
          interests={interests}
          onSuccess={() => {
            onSuccessCallback?.();
            closeComposer();
          }}
        />
      )}
    </PostComposerContext.Provider>
  );
}
