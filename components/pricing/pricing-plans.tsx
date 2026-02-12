'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const MONTHLY_PRICE = 20;
const ANNUAL_PRICE_PER_MONTH = 16; // 20% discount: $20 * 0.8 = $16
const ANNUAL_TOTAL = ANNUAL_PRICE_PER_MONTH * 12; // $192

export function PricingPlans() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Billing Toggle */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900/50 p-1">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
              selectedPlan === 'monthly'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
              selectedPlan === 'annual'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-2 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
              20% off
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Monthly Plan */}
        <div
          className={`relative rounded-2xl border-2 p-8 transition-all ${
            selectedPlan === 'monthly'
              ? 'border-purple-500 bg-gradient-to-br from-purple-900/20 to-pink-900/20'
              : 'border-neutral-800 bg-neutral-900/50'
          }`}
        >
          {selectedPlan === 'monthly' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-xs font-semibold text-white">
                Current Selection
              </span>
            </div>
          )}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Monthly</h3>
            <div className="mt-4">
              <span className="text-5xl font-bold text-white">${MONTHLY_PRICE}</span>
              <span className="ml-2 text-neutral-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              Billed monthly
            </p>
            <Button
              variant={selectedPlan === 'monthly' ? 'primary' : 'secondary'}
              className="mt-8 w-full bg-white text-black hover:bg-neutral-200"
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              isLoading={loading && selectedPlan === 'monthly'}
            >
              Subscribe Monthly
            </Button>
          </div>
        </div>

        {/* Annual Plan */}
        <div
          className={`relative rounded-2xl border-2 p-8 transition-all ${
            selectedPlan === 'annual'
              ? 'border-purple-500 bg-gradient-to-br from-purple-900/20 to-pink-900/20'
              : 'border-neutral-800 bg-neutral-900/50'
          }`}
        >
          {selectedPlan === 'annual' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-xs font-semibold text-white">
                Current Selection
              </span>
            </div>
          )}
          <div className="absolute -right-3 -top-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm10 10a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Annual</h3>
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-white">${ANNUAL_PRICE_PER_MONTH}</span>
                <span className="text-neutral-400">/month</span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                Billed ${ANNUAL_TOTAL} annually
              </p>
              <p className="mt-2 text-sm font-medium text-purple-400">
                Save ${(MONTHLY_PRICE - ANNUAL_PRICE_PER_MONTH) * 12} per year
              </p>
            </div>
            <Button
              variant={selectedPlan === 'annual' ? 'primary' : 'secondary'}
              className="mt-8 w-full bg-white text-black hover:bg-neutral-200"
              onClick={() => handleSubscribe('annual')}
              disabled={loading}
              isLoading={loading && selectedPlan === 'annual'}
            >
              Subscribe Annually
            </Button>
          </div>
        </div>
      </div>

      {/* Both plans include */}
      <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h4 className="mb-4 text-center text-lg font-semibold text-white">
          Both plans include:
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Unlimited posts in My Interests</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Priority support</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Exclusive premium badges</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-neutral-300">Ad-free experience</span>
          </div>
        </div>
      </div>
    </div>
  );
}
