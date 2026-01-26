'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Inner component that uses useSearchParams
function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/admin';

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/auth');
        if (res.ok) {
          // Already authenticated - redirect
          router.push(returnTo);
        }
      } catch (error) {
        // Not authenticated, show login form
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        // Success - redirect to admin (or return URL)
        router.push(returnTo);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-medium text-text-accent">[ADMIN ACCESS]</h1>
          <p className="text-xs text-text-muted mt-2 uppercase tracking-wider">
            Protected Area
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="module-section">
            <div className="module-header">&gt; AUTHENTICATION REQUIRED</div>
            <div className="p-4">
              <label className="block text-2xs text-text-muted uppercase tracking-wider mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-bg-primary border border-border-subtle text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-text-accent"
                autoFocus
                disabled={isLoading}
              />
              
              {error && (
                <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full mt-4 py-2 text-sm font-medium bg-status-active/20 text-status-active border border-status-active/40 hover:bg-status-active/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'AUTHENTICATING...' : 'ENTER ADMIN'}
              </button>
            </div>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-2xs text-text-muted hover:text-text-primary">
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoginLoading() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted">Loading...</div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <AdminLoginForm />
    </Suspense>
  );
}
