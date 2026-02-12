import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

/**
 * POST /api/premium/portal
 * Creates a Stripe Billing Portal session for the current user to manage subscription.
 * Requires authentication and an active subscription (subscription_id on user).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientFromRequest(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: row, error: rowError } = (await supabase
      .from('users')
      .select('subscription_id')
      .eq('id', user.id)
      .maybeSingle()) as {
      data: { subscription_id: string | null } | null;
      error: unknown;
    };

    if (rowError) {
      console.error('Portal: failed to fetch user subscription_id', rowError);
      return NextResponse.json(
        { error: 'Failed to load subscription' },
        { status: 500 }
      );
    }

    const subscriptionId = row?.subscription_id ?? null;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl?.origin || '';
    const returnUrl = `${baseUrl}/premium`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
