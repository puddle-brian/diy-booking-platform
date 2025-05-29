'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import MessageNotificationBadge from './MessageNotificationBadge';

export default function UserStatus() {
  const { user, logout, loading, clearDebugUser } = useAuth();

  const handleLogout = async () => {
    // Clear debug user first, then regular logout
    clearDebugUser();
    await logout();
    // Redirect to home
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          className="text-gray-700 hover:text-black font-medium"
        >
          Sign In
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
      {/* User Avatar Circle */}
      <Link 
        href="/dashboard" 
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        title={`${user.name} - Go to Dashboard`}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user.name)}
          </div>
        </div>
      </Link>
      
      <div className="flex items-center space-x-2">
        {/* Messages Link */}
        <Link 
          href="/messages"
          className="text-sm text-gray-600 hover:text-black flex items-center space-x-1 relative"
          title="View Messages"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Messages</span>
          <MessageNotificationBadge className="absolute -top-1 -right-1" />
        </Link>
        
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