'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface PricingTier {
  name: string;
  tier: 'FREE' | 'PRO' | 'VENUE_PRO';
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'FREE',
    price: '$0',
    period: '',
    description: 'Get started with basic booking tools',
    features: [
      '3 agent conversations/day',
      'Basic calendar view',
      'Search venues & artists',
      '3% fee on confirmed shows',
    ],
    cta: 'Current Plan',
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: '$10',
    period: '/month',
    description: 'For active touring artists',
    features: [
      'Unlimited agent conversations',
      'No transaction fees',
      'Priority search placement',
      'Advanced calendar features',
      'Export booking data',
    ],
    highlighted: true,
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Venue Pro',
    tier: 'VENUE_PRO',
    price: '$25',
    period: '/month',
    description: 'For venues booking regularly',
    features: [
      'Everything in Pro',
      'Bulk artist outreach',
      'Booking analytics',
      'Featured venue placement',
      'Calendar integrations',
      'Priority support',
    ],
    cta: 'Upgrade to Venue Pro',
  },
];

export default function UpgradePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('FREE');

  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    // Fetch current subscription status when user is loaded
    const fetchSubscription = async () => {
      if (!user?.id) return;
      
      try {
        const res = await fetch(`/api/usage?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentTier(data.subscription?.tier || 'FREE');
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    };
    fetchSubscription();
  }, [user?.id]);

  const handleUpgrade = async (tier: 'PRO' | 'VENUE_PRO') => {
    if (!user?.id) {
      router.push('/auth/login?redirect=/upgrade');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.id) return;

    setLoading('manage');
    setError(null);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold text-lg">DIYSHOWS</span>
          </a>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-sm text-gray-600">{user.email}</span>
            ) : (
              <a href="/auth/login?redirect=/upgrade" className="text-sm text-blue-600 hover:text-blue-800">
                Log in
              </a>
            )}
            <a href="/" className="text-sm text-gray-500 hover:text-gray-800">
              ← Back
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Booking Power
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get unlimited AI-powered booking assistance and zero transaction fees.
            More shows, less hassle.
          </p>
        </div>

        {/* Login prompt for unauthenticated users */}
        {!user && (
          <div className="max-w-md mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 mb-2">
              <a href="/auth/login?redirect=/upgrade" className="underline font-medium">Log in</a> or{' '}
              <a href="/auth/register?redirect=/upgrade" className="underline font-medium">create an account</a> to upgrade
            </p>
          </div>
        )}

        {/* Cancelled notice */}
        {cancelled && (
          <div className="max-w-md mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              Checkout cancelled. No worries - upgrade whenever you're ready!
            </p>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current subscription notice */}
        {currentTier !== 'FREE' && (
          <div className="max-w-md mx-auto mb-8 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 mb-2">
              You're on the <strong>{currentTier}</strong> plan! 🎉
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={loading === 'manage'}
              className="text-green-700 underline hover:text-green-900 text-sm"
            >
              {loading === 'manage' ? 'Loading...' : 'Manage subscription →'}
            </button>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => {
            const isCurrentPlan = currentTier === tier.tier;
            const canUpgrade = tier.tier !== 'FREE' && !isCurrentPlan;

            return (
              <div
                key={tier.tier}
                className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col ${
                  tier.highlighted
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    <span className="text-gray-500">{tier.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => canUpgrade && handleUpgrade(tier.tier as 'PRO' | 'VENUE_PRO')}
                  disabled={!canUpgrade || loading === tier.tier}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : tier.tier === 'FREE'
                        ? 'bg-gray-100 text-gray-500 cursor-default'
                        : tier.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {loading === tier.tier
                    ? 'Loading...'
                    : isCurrentPlan
                      ? '✓ Current Plan'
                      : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Cancel anytime from your billing portal. You'll keep Pro features
                until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What's the 3% transaction fee?
              </h3>
              <p className="text-gray-600">
                On the Free plan, we take a small 3% fee when a show is confirmed through
                the platform. Pro subscribers pay zero transaction fees.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What counts as an "agent conversation"?
              </h3>
              <p className="text-gray-600">
                Each message you send to the AI booking agent counts as one conversation.
                Free users get 3 per day, Pro users get unlimited.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          Questions? Email us at support@diyshows.com
        </div>
      </footer>
    </div>
  );
}
