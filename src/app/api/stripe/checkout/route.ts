import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '../../../../../lib/stripe';
import { prisma } from '../../../../../lib/prisma';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for subscription
 * 
 * Body: { userId: string, tier: 'PRO' | 'VENUE_PRO' }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, tier } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'userId and tier are required' },
        { status: 400 }
      );
    }

    if (!['PRO', 'VENUE_PRO'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be PRO or VENUE_PRO' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    if (user.subscription?.status === 'ACTIVE' && user.subscription?.tier !== 'FREE') {
      return NextResponse.json(
        { error: 'User already has an active subscription. Use the billing portal to manage.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          username: user.username,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Get the price ID for the selected tier
    const priceId = tier === 'PRO' ? STRIPE_PRICES.PRO : STRIPE_PRICES.VENUE_PRO;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/upgrade?cancelled=true`,
      metadata: {
        userId: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
