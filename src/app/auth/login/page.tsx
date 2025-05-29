'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

export default function LoginPage() {
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/og-image.png" 
            alt="DIY Shows" 
            className="h-12 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Welcome back' : 'Join the community'}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {isLogin 
            ? 'Sign in to diyshows beta' 
            : 'Create your account to get started'
          }
        </p>
        {isDebugUser && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🔧 Debug User Login
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/" className="font-medium text-black hover:text-gray-800">
            return to homepage
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Toggle between Login and Register */}
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                isLogin
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b ${
                !isLogin
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Debug User Info */}
          {isDebugUser && isLogin && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  Debug user credentials have been pre-filled. Click "Sign in" to continue.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Fields - Only for Registration */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm ${
                    isDebugUser ? 'bg-blue-50' : ''
                  }`}
                  placeholder="your@email.com"
                  readOnly={isDebugUser}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm ${
                    isDebugUser ? 'bg-blue-50' : ''
                  }`}
                  placeholder={isLogin ? "Your password" : "Create a password"}
                  readOnly={isDebugUser}
                />
              </div>
            </div>

            {/* Location Field - Only for Registration */}
            {!isLogin && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1">
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                    placeholder="City, State/Province"
                  />
                </div>
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
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-black hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-black hover:underline">Privacy Policy</a>
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign in' : 'Create account')
                }
              </button>
            </div>
          </form>

          {/* Development Helper - Only show for login */}
          {isLogin && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500 mb-3">
                Development setup: If this is your first time, initialize the system with a default admin account.
              </p>
              <button
                onClick={initializeSystem}
                className="w-full text-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Initialize System (Create Admin)
              </button>
            </div>
          )}

          {/* Profile claiming section - Only show for login */}
          {isLogin && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Need to claim your profile?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  href="/"
                  className="text-sm text-gray-600 hover:text-black"
                >
                  Browse artists and venues to find claim buttons on their profiles
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
