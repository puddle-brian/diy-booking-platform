import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});

// Your Stripe Price IDs - create these in your Stripe Dashboard
// Products > Create Product > Add Prices
export const STRIPE_PRICES = {
  PRO: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  VENUE_PRO: process.env.STRIPE_PRICE_VENUE_PRO || 'price_venue_pro_placeholder',
};

// Map Stripe price IDs back to tier names
export const PRICE_TO_TIER: Record<string, 'PRO' | 'VENUE_PRO'> = {
  [STRIPE_PRICES.PRO]: 'PRO',
  [STRIPE_PRICES.VENUE_PRO]: 'VENUE_PRO',
};

// Webhook event types we care about
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
};
