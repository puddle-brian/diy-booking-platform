'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function UserStatus() {
  const { user, logout, loading, clearDebugUser } = useAuth();

  const handleLogout = async () => {
    // Clear debug user first, then regular logout
    clearDebugUser();
    await logout();
    // Redirect to home
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/auth/login"
          className="text-sm text-gray-600 hover:text-black"
        >
          Sign In
        </Link>
        <Link 
          href="/auth/login"
          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
        >
          Sign Up
        </Link>
        {/* Always show admin link for debug access */}
        <Link 
          href="/admin"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/dashboard" className="text-sm hover:bg-gray-50 rounded-lg p-2 transition-colors">
        <div className="font-medium text-gray-900">{user.name}</div>
        <div className="text-gray-600 capitalize">
          {user.role} {user.profileType && `• ${user.profileType}`}
        </div>
      </Link>
      
      <div className="flex items-center space-x-2">
        {/* Always show admin link for debug purposes */}
        <Link 
          href="/admin"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Admin
        </Link>
        
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-black"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 