import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = await createClient();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId) {
        console.error('No userId in session metadata');
        break;
      }

      // Get customer subscription
      const subscriptionId = session.subscription as string;
      if (!subscriptionId) {
        console.error('No subscription ID in session');
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update user's premium status in database
      // TODO: Create a subscriptions table or add premium fields to users table
      // For now, we'll just log it
      console.log('Premium subscription activated:', {
        userId,
        plan,
        subscriptionId,
        customerId: subscription.customer,
      });

      // Example: Update user record (adjust based on your schema)
      // const { error } = await supabase
      //   .from('users')
      //   .update({
      //     is_premium: true,
      //     subscription_id: subscriptionId,
      //     subscription_plan: plan,
      //   })
      //   .eq('id', userId);

      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by customer ID or subscription ID
      // Update premium status based on subscription status
      const isActive = subscription.status === 'active';
      
      console.log('Subscription updated:', {
        customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
        isActive,
      });

      // Example: Update user record
      // const { error } = await supabase
      //   .from('users')
      //   .update({
      //     is_premium: isActive,
      //   })
      //   .eq('subscription_id', subscription.id);

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
