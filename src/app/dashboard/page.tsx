'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to user's profile page
      router.replace(`/profile/${user.id}`);
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  );
}
