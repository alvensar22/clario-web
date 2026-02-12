import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Price IDs - these should be created in Stripe Dashboard
// Monthly: $20/month
export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder';
// Annual: $192/year ($16/month equivalent)
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ID_ANNUAL || 'price_annual_placeholder';
