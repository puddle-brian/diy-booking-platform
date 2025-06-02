'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MessageNotificationBadgeProps {
  className?: string;
}

export default function MessageNotificationBadge({ className = '' }: MessageNotificationBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced refresh function to prevent excessive API calls
  const debouncedRefresh = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      loadUnreadCount();
    }, 500); // 500ms debounce
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // 🚀 PERFORMANCE FIX: Reduce polling from 30s to 5 minutes
      const startPolling = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(loadUnreadCount, 5 * 60 * 1000); // 5 minutes
      };

      const stopPolling = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      // 🚀 PERFORMANCE FIX: Only poll when tab is visible/focused
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopPolling();
        } else {
          loadUnreadCount(); // Refresh when tab becomes visible
          startPolling();
        }
      };

      const handleFocus = () => {
        loadUnreadCount();
        startPolling();
      };

      const handleBlur = () => {
        stopPolling();
      };

      // Start initial polling
      startPolling();

      // Listen for tab visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      
      // 🚀 PERFORMANCE FIX: Use debounced refresh for custom events
      window.addEventListener('refreshUnreadCount', debouncedRefresh);
      
      return () => {
        stopPolling();
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('refreshUnreadCount', debouncedRefresh);
      };
    }
  }, [user, debouncedRefresh]);

  const loadUnreadCount = async () => {
    if (!user || loading) return;
    
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