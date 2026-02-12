import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { PricingPlans } from '@/components/pricing/pricing-plans';

export const dynamic = 'force-dynamic';

interface PricingPageProps {
  searchParams: Promise<{ canceled?: string }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const api = await getApiClient();
  const { data: session } = await api.getSession();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { canceled } = await searchParams;
  const showCancelMessage = canceled === 'true';

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} isPremium={me.is_premium} />
      <main className="ml-56 pt-0">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Cancel Message */}
          {showCancelMessage && (
            <div className="mb-8 rounded-xl border border-yellow-800/50 bg-yellow-900/20 px-4 py-3 text-center">
              <p className="text-sm text-yellow-400">
                Payment was canceled. You can try again anytime.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Choose your
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                {' '}Premium{' '}
              </span>
              plan
            </h1>
            <p className="mt-4 text-lg text-neutral-400">
              Unlock unlimited access to My Interests feed and exclusive features
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="mt-16">
            <PricingPlans />
          </div>

          {/* Features Section */}
          <div className="mt-24">
            <h2 className="text-center text-2xl font-bold text-white">
              Everything you get with Premium
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Unlimited Posts</h3>
                <p className="text-sm text-neutral-400">
                  See unlimited posts in your My Interests feed without daily limits
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                  <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Priority Support</h3>
                <p className="text-sm text-neutral-400">
                  Get faster response times and dedicated support from our team
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Exclusive Badges</h3>
                <p className="text-sm text-neutral-400">
                  Show off your Premium status with exclusive badges on your profile
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Advanced Analytics</h3>
                <p className="text-sm text-neutral-400">
                  Get detailed insights into your posts and engagement metrics
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                  <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Ad-Free Experience</h3>
                <p className="text-sm text-neutral-400">
                  Enjoy a clean, uninterrupted browsing experience without ads
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Early Access</h3>
                <p className="text-sm text-neutral-400">
                  Be the first to try new features and provide feedback
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-center text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <div className="mt-12 mx-auto max-w-3xl space-y-6">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Can I cancel anytime?
                </h3>
                <p className="text-sm text-neutral-400">
                  Yes, you can cancel your Premium subscription at any time. Your access will continue until the end of your billing period.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  What payment methods do you accept?
                </h3>
                <p className="text-sm text-neutral-400">
                  We accept all major credit cards, debit cards, and PayPal.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Will I be charged immediately?
                </h3>
                <p className="text-sm text-neutral-400">
                  Yes, you'll be charged immediately upon subscribing. For annual plans, you'll be charged the full amount upfront.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
