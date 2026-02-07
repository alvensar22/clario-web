'use client';

import { api } from '@/lib/api/client';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileFollowButtonProps {
  username: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  initialFollowingCount: number;
  isOwnProfile: boolean;
}

export function ProfileFollowButton({
  username,
  initialFollowing,
  initialFollowerCount,
  initialFollowingCount,
  isOwnProfile,
}: ProfileFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followingCount] = useState(initialFollowingCount);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (isOwnProfile || loading) return;
    setLoading(true);
    const res = following
      ? await api.unfollowUser(username)
      : await api.followUser(username);
    setLoading(false);
    if (res.data) {
      setFollowing(res.data.following);
      const status = await api.getFollowStatus(username);
      if (status.data) setFollowerCount(status.data.followerCount);
    }
  }, [username, following, isOwnProfile, loading]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
        <span><strong className="font-medium text-neutral-900 dark:text-neutral-100">{followerCount}</strong> followers</span>
        <span><strong className="font-medium text-neutral-900 dark:text-neutral-100">{followingCount}</strong> following</span>
      </div>
      {!isOwnProfile && (
        <Button
          variant={following ? 'secondary' : 'primary'}
          onClick={toggle}
          disabled={loading}
          className="transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? '…' : following ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </div>
  );
}
