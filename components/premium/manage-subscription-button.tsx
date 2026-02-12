'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/premium/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No portal URL received');
    } catch (e) {
      console.error('Portal error:', e);
      alert(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={handleManage}
      disabled={loading}
      className="inline-flex items-center gap-2"
    >
      <Crown className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
      {loading ? 'Opening…' : 'Manage subscription'}
    </Button>
  );
}
