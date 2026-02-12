# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for the Premium subscription feature.

## Prerequisites

1. A Stripe account ([sign up here](https://stripe.com))
2. Access to Stripe Dashboard

## Step 1: Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

## Step 2: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_`)
4. Copy your **Publishable key** (starts with `pk_`)

## Step 3: Create Products and Prices in Stripe

### Create Monthly Subscription Product

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Set up:
   - **Name**: Premium Monthly
   - **Description**: Premium subscription billed monthly
   - **Pricing**: 
     - **Price**: $20.00 USD
     - **Billing period**: Monthly
   - Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

### Create Annual Subscription Product

1. Click **Add product** again
2. Set up:
   - **Name**: Premium Annual
   - **Description**: Premium subscription billed annually (20% discount)
   - **Pricing**:
     - **Price**: $192.00 USD
     - **Billing period**: Yearly
   - Click **Save product**
3. Copy the **Price ID** (starts with `price_`)

## Step 4: Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://yourdomain.com/api/webhooks/stripe`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key (if needed for client-side)

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_ID_MONTHLY=price_... # Monthly subscription price ID
STRIPE_PRICE_ID_ANNUAL=price_... # Annual subscription price ID

# Stripe Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret

# Base URL (for redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Change to your production URL
```

## Step 6: Update Database Schema (Optional)

You may want to add premium subscription fields to your users table:

```sql
-- Add premium fields to users table
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_plan TEXT; -- 'monthly' or 'annual'
ALTER TABLE users ADD COLUMN subscription_status TEXT; -- 'active', 'canceled', etc.
```

Then update the webhook handler (`app/api/webhooks/stripe/route.ts`) to save subscription data.

## Step 7: Test the Integration

### Test Mode

1. Use Stripe test mode keys (they start with `sk_test_` and `pk_test_`)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date, any CVC, any ZIP

### Testing Flow

1. Go to `/pricing` page
2. Select a plan (Monthly or Annual)
3. Click "Subscribe" button
4. You'll be redirected to Stripe Checkout
5. Use test card `4242 4242 4242 4242`
6. Complete the payment
7. You'll be redirected to `/payment/success`

### Testing Webhooks Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or see [Stripe CLI docs](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook signing secret and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Production Deployment

1. Switch to **Live mode** in Stripe Dashboard
2. Get your **live** API keys
3. Create products/prices in **live mode**
4. Set up webhook endpoint with your production URL
5. Update environment variables with live keys
6. Update `NEXT_PUBLIC_BASE_URL` to your production domain

## Security Notes

- **Never** commit `.env.local` to git
- Keep your `STRIPE_SECRET_KEY` secure
- Always verify webhook signatures
- Use HTTPS in production
- Validate user authentication before creating checkout sessions

## Troubleshooting

### Checkout not redirecting
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Check browser console for errors
- Verify API route is accessible

### Webhooks not working
- Verify webhook secret is correct
- Check Stripe Dashboard → Webhooks for delivery logs
- Ensure webhook endpoint URL is accessible
- For local testing, use Stripe CLI

### Payment succeeds but user not upgraded
- Check webhook handler logs
- Verify database update queries
- Check Stripe Dashboard → Events for webhook delivery status

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
