'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { usePostComposer } from '@/components/post/post-composer-provider';

export default function CreatePostPage() {
  const router = useRouter();
  const { openComposer } = usePostComposer();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    async function loadAndOpen() {
      const [{ data: session }, { data: me }, { data: interests }] = await Promise.all([
        api.getSession(),
        api.getMe(),
        api.getInterests(),
      ]);

      if (!session?.user) {
        router.push('/login');
        return;
      }

      if (!me?.username) {
        router.push('/onboarding');
        return;
      }

      openComposer(
        { username: me.username, avatar_url: me.avatar_url },
        interests ?? [],
        () => router.push('/')
      );
      setOpened(true);
    }

    if (!opened) loadAndOpen();
  }, [opened, router, openComposer]);

  // Redirect after opening modal
  useEffect(() => {
    if (opened) {
      const timer = setTimeout(() => router.push('/'), 100);
      return () => clearTimeout(timer);
    }
  }, [opened, router]);

  return null;
}
