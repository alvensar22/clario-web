import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { PremiumUpgradeContent } from '@/components/pricing/premium-upgrade-content';
import { ManageSubscriptionButton } from '@/components/premium/manage-subscription-button';
import { PremiumBadge } from '@/components/premium/premium-badge';

export const dynamic = 'force-dynamic';

interface PremiumPageProps {
  searchParams: Promise<{ canceled?: string }>;
}

export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const api = await getApiClient();
  const { data: session } = await api.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { canceled } = await searchParams;
  const showCancelMessage = canceled === 'true';
  const isPremium = me.is_premium === true;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} isPremium={me.is_premium} />
      <main className="ml-56 pt-0">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {showCancelMessage && (
            <div className="mb-8 rounded-xl border border-yellow-800/50 bg-yellow-900/20 px-4 py-3 text-center">
              <p className="text-sm text-yellow-400">
                Payment was canceled. You can try again anytime.
              </p>
            </div>
          )}

          {isPremium ? (
            /* Premium: Manage subscription */
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 flex items-center justify-center gap-3">
                <PremiumBadge size="lg" ariaLabel="Premium member" />
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                  Premium
                </h1>
              </div>
              <p className="mb-8 text-center text-neutral-400">
                You’re a Premium member. Manage your subscription, payment method, and billing in Stripe’s secure portal.
              </p>
              <div className="flex justify-center">
                <ManageSubscriptionButton />
              </div>
              <p className="mt-6 text-center text-sm text-neutral-500">
                You can update your payment method, view invoices, or cancel your subscription there.
              </p>
            </div>
          ) : (
            /* Non-premium: Upgrade plans */
            <PremiumUpgradeContent />
          )}
        </div>
      </main>
    </div>
  );
}
