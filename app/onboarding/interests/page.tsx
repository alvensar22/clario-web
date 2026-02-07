'use client';

import { api } from '@/lib/api/client';
import type { ApiInterest } from '@/lib/api/types';
import { useUser } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function OnboardingInterestsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getInterests(), api.getMyInterests()]).then(
      ([interestsRes, myRes]) => {
        setLoading(false);
        if (interestsRes.error) {
          setError(interestsRes.error);
          return;
        }
        setInterests(interestsRes.data ?? []);
        const ids = myRes.data?.interestIds ?? [];
        setSelectedIds(new Set(ids));
      }
    );
  }, [user]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: err } = await api.putMyInterests({
      interestIds: Array.from(selectedIds),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(returnTo);
    router.refresh();
  }, [user, selectedIds, router, returnTo]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Choose your interests
          </h1>
          <p className="text-sm text-neutral-400">
            Select what you care about. We&apos;ll use this to tailor your feed.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-3">
              {interests.map((interest) => {
                const isSelected = selectedIds.has(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggle(interest.id)}
                    className={
                      'rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ' +
                      (isSelected
                        ? 'border-white bg-white text-black'
                        : 'border-white text-white hover:bg-white/10')
                    }
                  >
                    {interest.name}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-6 text-center text-sm text-red-400">{error}</p>
            )}

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full border border-white bg-white px-8 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save and continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
