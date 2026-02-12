import { getApiClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PaymentSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const api = await getApiClient();
  const { data: session } = await api.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const { data: me } = await api.getMe();
  if (!me?.username) redirect('/onboarding');

  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={me.username} isPremium={me.is_premium} />
      <main className="ml-56 pt-0">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white">Payment Successful!</h1>
            <p className="mb-8 text-lg text-neutral-400">
              Thank you for subscribing to Premium. Your account has been upgraded and you now have access to all premium features.
            </p>

            {session_id && (
              <p className="mb-8 text-sm text-neutral-500">
                Session ID: {session_id}
              </p>
            )}

            {/* Features List */}
            <div className="mb-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-left">
              <h2 className="mb-4 text-xl font-semibold text-white">What's Next?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-300">Unlimited posts in My Interests feed</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-300">Priority support access</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-300">Exclusive premium badges</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button variant="primary" className="w-full sm:w-auto px-8">
                  Go to Feed
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" className="w-full sm:w-auto px-8">
                  View Plan Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
