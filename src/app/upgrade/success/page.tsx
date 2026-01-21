'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<SuccessPageLoading />}>
      <SuccessPageContent />
    </Suspense>
  );
}

function SuccessPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give a moment for the webhook to process
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {loading ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Processing...
              </h1>
              <p className="text-gray-600">
                Setting up your subscription
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Pro!
              </h1>
              
              <p className="text-gray-600 mb-6">
                Your subscription is now active. You have unlimited access to the
                AI booking agent and zero transaction fees on all your shows.
              </p>

              <div className="space-y-3">
                <Link
                  href="/agent"
                  className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Booking →
                </Link>
                
                <Link
                  href="/"
                  className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back to Home
                </Link>
              </div>

              <p className="text-gray-400 text-sm mt-6">
                Session: {sessionId?.slice(0, 20)}...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
