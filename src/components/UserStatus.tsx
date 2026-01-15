'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import MessageNotificationBadge from './MessageNotificationBadge';

export default function UserStatus() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
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
        <span className="text-2xs text-text-muted uppercase tracking-wider animate-pulse">
          [LOADING...]
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link 
          href="/auth/login" 
          className="text-xs text-text-secondary hover:text-text-accent uppercase tracking-wider transition-colors"
        >
          [SIGN IN]
        </Link>
        <Link 
          href="/admin"
          className="text-xs text-status-info hover:text-status-info/80 uppercase tracking-wider transition-colors"
        >
          [ADMIN]
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatar - Terminal Style */}
      <div className="relative">
        <Link 
          href={`/profile/${user.id}`} 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          title={`${user.name} - View Profile`}
        >
          <div className="w-8 h-8 border border-border-default flex items-center justify-center bg-bg-tertiary">
            <span className="text-xs font-medium text-text-accent">
              {getInitials(user.name)}
            </span>
          </div>
          <span className="hidden md:block text-xs text-text-secondary uppercase tracking-wider">
            {user.name.split(' ')[0]}
          </span>
        </Link>
        {/* Message Notification Badge */}
        <Link href="/messages" title="View Messages">
          <MessageNotificationBadge className="absolute -top-1 -right-1 cursor-pointer hover:scale-110 transition-transform" />
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <Link 
          href="/admin"
          className="text-2xs text-status-info hover:text-status-info/80 uppercase tracking-wider transition-colors"
        >
          [ADMIN]
        </Link>
        
        <button
          onClick={handleLogout}
          className="text-2xs text-text-muted hover:text-status-error uppercase tracking-wider transition-colors"
        >
          [OUT]
        </button>
      </div>
    </div>
  );
}
