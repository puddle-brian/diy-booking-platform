'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MessageNotificationBadgeProps {
  className?: string;
}

export default function MessageNotificationBadge({ className = '' }: MessageNotificationBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Refresh unread count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      
      // Listen for custom events to refresh immediately
      const handleRefresh = () => loadUnreadCount();
      window.addEventListener('refreshUnreadCount', handleRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshUnreadCount', handleRefresh);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Helper function to get headers with debug user info if needed
      const getApiHeaders = () => {
        const headers: Record<string, string> = {};

        // If user is a debug user (stored in localStorage), include it in headers
        if (typeof window !== 'undefined') {
          const debugUser = localStorage.getItem('debugUser');
          if (debugUser && user) {
            headers['x-debug-user'] = debugUser;
          }
        }

        return headers;
      };

      const response = await fetch('/api/messages/conversations', {
        headers: getApiHeaders()
      });
      if (response.ok) {
        const conversations = await response.json();
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || unreadCount === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg border-2 border-white">
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
    </div>
  );
} 