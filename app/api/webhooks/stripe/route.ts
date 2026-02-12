import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>> | null = null;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error(
      '[Stripe webhook] NEXT_PUBLIC_SUPABASE_ROLE_KEY is missing or invalid. User table will NOT be updated. Add it to .env.local (Supabase Dashboard → Settings → API → use role key, not anon).',
      (e as Error).message
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as string | undefined; // 'monthly' | 'annual'

      if (!userId) {
        console.error('[Stripe webhook] checkout.session.completed: No userId in session.metadata. Check that checkout session is created with metadata: { userId: session.user.id, plan }.');
        break;
      }

      // session.subscription can be string (id) or expanded object
      const rawSub = session.subscription;
      const subscriptionId =
        typeof rawSub === 'string' ? rawSub : (rawSub as Stripe.Subscription | null)?.id ?? null;
      if (!subscriptionId) {
        console.error('[Stripe webhook] checkout.session.completed: No subscription ID in session.');
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionStatus = subscription.status;

      if (!supabase) {
        console.error('[Stripe webhook] Skipping user update: Supabase service role client not available.');
        break;
      }

      const payload = {
        is_premium: subscriptionStatus === 'active',
        subscription_id: subscriptionId,
        subscription_plan: plan ?? null,
        subscription_status: subscriptionStatus,
      };
      // @ts-expect-error - subscription fields added via migrations; generated types may not include them
      const { error } = await supabase.from('users').update(payload).eq('id', userId);
      if (error) {
        console.error(
          '[Stripe webhook] Failed to update user subscription:',
          error.message,
          'code:',
          error.code,
          'details:',
          error.details
        );
      } else {
        console.log('[Stripe webhook] User subscription updated successfully:', { userId, subscriptionId, subscriptionStatus });
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const isActive = subscription.status === 'active';

      if (!supabase) {
        console.error('[Stripe webhook] Skipping subscription update: Supabase service role client not available.');
        break;
      }
      const payload =
        event.type === 'customer.subscription.deleted'
          ? {
              is_premium: false,
              subscription_id: null,
              subscription_plan: null,
              subscription_status: subscription.status,
            }
          : {
              is_premium: isActive,
              subscription_status: subscription.status,
            };
      // @ts-expect-error - subscription fields added via migrations; generated types may not include them
      const { error } = await supabase.from('users').update(payload).eq('subscription_id', subscription.id);
      if (error) {
        console.error('[Stripe webhook] Failed to update user on subscription change:', error.message, 'code:', error.code);
      } else {
        console.log('[Stripe webhook] User subscription status updated:', { subscriptionId: subscription.id, status: subscription.status });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing for webhooks - Stripe needs raw body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
