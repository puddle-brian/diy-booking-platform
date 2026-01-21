import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_TO_TIER, WEBHOOK_EVENTS } from '../../../../../lib/stripe';
import { prisma } from '../../../../../lib/prisma';
import Stripe from 'stripe';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * 
 * Configure this URL in your Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - activate subscription
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'PRO' | 'VENUE_PRO';
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !tier) {
    console.error('Missing userId or tier in checkout session metadata');
    return;
  }

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const periodStart = new Date(stripeSubscription.current_period_start * 1000);
  const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

  // Update or create subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'ACTIVE',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      tier,
      status: 'ACTIVE',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`✅ Subscription activated for user ${userId}: ${tier}`);
}

/**
 * Handle subscription updates (plan changes, renewals, cancellations scheduled)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? PRICE_TO_TIER[priceId] : undefined;

  // Map Stripe status to our status
  let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED' = 'ACTIVE';
  if (subscription.status === 'past_due') status = 'PAST_DUE';
  if (subscription.status === 'canceled') status = 'CANCELLED';
  if (subscription.status === 'paused') status = 'PAUSED';

  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.subscription.update({
    where: { userId },
    data: {
      tier: tier || undefined,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`📝 Subscription updated for user ${userId}: ${status}`);
}

/**
 * Handle subscription cancellation - downgrade to free
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'FREE',
      status: 'CANCELLED',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`❌ Subscription cancelled for user ${userId}, downgraded to FREE`);
}

/**
 * Handle failed payment - mark as past due
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    console.error('No subscription found for customer:', customerId);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' },
  });

  console.log(`⚠️ Payment failed for user ${subscription.userId}`);
  
  // TODO: Send email notification about failed payment
}
