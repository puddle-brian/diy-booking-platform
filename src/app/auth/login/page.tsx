'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDebugUser, setIsDebugUser] = useState(false);

  // Pre-fill form with URL parameters (for debug users)
  useEffect(() => {
    if (!searchParams) return;
    
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const name = searchParams.get('name');
    
    if (email && password) {
      setFormData(prev => ({
        ...prev,
        email: email,
        password: password
      }));
      setIsDebugUser(true);
      
      if (name) {
        console.log('Pre-filling login form for debug user:', name);
      }
    }
  }, [searchParams]);

  // Redirect to user's profile after successful login
  useEffect(() => {
    if (user && success.includes('Login successful')) {
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 1500);
    }
  }, [user, success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Use AuthContext login function for proper state management
        await login(formData.email, formData.password);
        setSuccess('Login successful! Redirecting to your profile...');
        // Redirect is now handled by useEffect when user state updates
      } else {
        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Registration failed');
        }

        setSuccess('Registration successful! Please sign in.');
        setIsLogin(true); // Switch to login mode
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const initializeSystem = async () => {
    try {
      const response = await fetch('/api/auth/init', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success && result.admin) {
        setSuccess(`Default admin created! Email: ${result.admin.email}, Password: ${result.admin.defaultPassword}`);
      } else {
        setError(result.message || 'System already initialized');
      }
    } catch (error) {
      setError('Failed to initialize system');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="text-2xl font-mono text-text-primary tracking-tight">
            [DIY_SHOWS]
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-mono text-text-primary mb-2">
          {isLogin ? '>> WELCOME_BACK' : '>> JOIN_COMMUNITY'}
        </h2>
        <p className="text-center text-text-secondary mb-8 font-mono text-sm">
          {isLogin 
            ? 'Sign in to diyshows beta' 
            : 'Create your account to get started'
          }
        </p>
        {isDebugUser && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-3 py-1 border border-status-info text-xs font-mono text-status-info">
              [DEBUG_MODE]
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-sm text-text-muted font-mono">
          Or{' '}
          <Link href="/" className="text-text-primary hover:text-text-secondary underline">
            [RETURN_HOME]
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-secondary border border-border-primary p-6">
          {/* Toggle between Login and Register */}
          <div className="flex mb-6 border border-border-primary">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-mono transition-colors ${
                isLogin
                  ? 'bg-text-primary text-bg-primary'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              [SIGN_IN]
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-mono transition-colors border-l border-border-primary ${
                !isLogin
                  ? 'bg-text-primary text-bg-primary'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              [SIGN_UP]
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 border border-status-error bg-status-error/10">
              <p className="text-sm text-status-error font-mono">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 border border-status-success bg-status-success/10">
              <p className="text-sm text-status-success font-mono">{success}</p>
            </div>
          )}

          {/* Debug User Info */}
          {isDebugUser && isLogin && (
            <div className="mb-4 p-3 border border-status-info bg-status-info/10">
              <div className="flex items-center">
                <span className="text-status-info mr-2">&gt;&gt;</span>
                <p className="text-sm text-status-info font-mono">
                  Debug credentials pre-filled. Click sign in to continue.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete={isDebugUser ? "off" : "on"}>
            {/* Name Fields - Only for Registration */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-mono text-text-muted mb-1 uppercase">
                    First_Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="block w-full bg-bg-tertiary border border-border-primary px-3 py-2 text-text-primary font-mono text-sm placeholder-text-muted focus:border-text-primary focus:outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-mono text-text-muted mb-1 uppercase">
                    Last_Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="block w-full bg-bg-tertiary border border-border-primary px-3 py-2 text-text-primary font-mono text-sm placeholder-text-muted focus:border-text-primary focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-mono text-text-muted mb-1 uppercase">
                Email_Address
              </label>
              <input
                id="email"
                name={isDebugUser ? "debug-email" : "email"}
                type="email"
                autoComplete={isDebugUser ? "off" : "email"}
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`block w-full bg-bg-tertiary border border-border-primary px-3 py-2 text-text-primary font-mono text-sm placeholder-text-muted focus:border-text-primary focus:outline-none ${
                  isDebugUser ? 'bg-status-info/10 border-status-info' : ''
                }`}
                placeholder="your@email.com"
                readOnly={isDebugUser}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono text-text-muted mb-1 uppercase">
                Password
              </label>
              <input
                id="password"
                name={isDebugUser ? "debug-password" : "password"}
                type="password"
                autoComplete={isDebugUser ? "off" : (isLogin ? "current-password" : "new-password")}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`block w-full bg-bg-tertiary border border-border-primary px-3 py-2 text-text-primary font-mono text-sm placeholder-text-muted focus:border-text-primary focus:outline-none ${
                  isDebugUser ? 'bg-status-info/10 border-status-info' : ''
                }`}
                placeholder={isLogin ? "Your password" : "Create a password"}
                readOnly={isDebugUser}
              />
            </div>

            {/* Location Field - Only for Registration */}
            {!isLogin && (
              <div>
                <label htmlFor="location" className="block text-xs font-mono text-text-muted mb-1 uppercase">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="block w-full bg-bg-tertiary border border-border-primary px-3 py-2 text-text-primary font-mono text-sm placeholder-text-muted focus:border-text-primary focus:outline-none"
                  placeholder="City, State/Province"
                />
              </div>
            )}

            {/* Terms Agreement - Only for Registration */}
            {!isLogin && (
              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 bg-bg-tertiary border-border-primary text-text-primary focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-text-secondary font-mono">
                  I agree to the{' '}
                  <a href="#" className="text-text-primary hover:underline">[Terms]</a>
                  {' '}and{' '}
                  <a href="#" className="text-text-primary hover:underline">[Privacy]</a>
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center border border-text-primary bg-text-primary py-2.5 px-4 text-sm font-mono text-bg-primary hover:bg-transparent hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (isLogin ? '>> AUTHENTICATING...' : '>> CREATING...') 
                  : (isLogin ? '>> SIGN_IN' : '>> CREATE_ACCOUNT')
                }
              </button>
            </div>
          </form>

          {/* Development Helper - Only show for login */}
          {isLogin && (
            <div className="mt-6 border-t border-border-primary pt-6">
              <p className="text-xs text-text-muted font-mono mb-3">
                // DEV: Initialize system with default admin
              </p>
              <button
                onClick={initializeSystem}
                className="w-full text-center border border-border-secondary py-2 px-4 text-sm font-mono text-text-secondary hover:border-text-primary hover:text-text-primary transition-colors"
              >
                [INIT_SYSTEM]
              </button>
            </div>
          )}

          {/* Profile claiming section - Only show for login */}
          {isLogin && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-primary" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-bg-secondary px-2 text-text-muted font-mono">Need to claim profile?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  href="/"
                  className="text-sm text-text-secondary hover:text-text-primary font-mono underline"
                >
                  [BROWSE_PROFILES]
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
