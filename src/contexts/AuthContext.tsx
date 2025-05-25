'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  profileId?: string;
  profileType?: 'venue' | 'artist';
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // Debug functions for testing
  setDebugUser: (userData: any) => void;
  clearDebugUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for authentication on mount
  useEffect(() => {
    // Only check auth if we don't have a debug user in localStorage
    const checkForAuth = async () => {
      if (typeof window !== 'undefined') {
        const debugUser = localStorage.getItem('debugUser');
        if (debugUser) {
          console.log('AuthContext: Debug user found in localStorage, skipping API auth check');
          return; // Skip API check if we have a debug user
        }
      }
      
      console.log('AuthContext: No debug user found, checking API auth');
      await checkAuth();
    };
    
    checkForAuth();
  }, []);

  // Load user from localStorage on mount (for debug persistence)
  useEffect(() => {
    const loadStoredUser = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('debugUser');
        if (stored) {
          try {
            const userData = JSON.parse(stored);
            console.log('AuthContext: Loading debug user from localStorage:', userData.name);
            setUser(userData);
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('debugUser');
          }
        }
      }
      setLoading(false);
    };

    loadStoredUser();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear both debug and regular user data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('debugUser');
        localStorage.removeItem('currentUser');
      }
    }
  };

  // Debug functions for admin testing
  const setDebugUser = (userData: any) => {
    console.log('Setting debug user:', userData);
    
    // Handle the new user structure
    const debugUser: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      profileId: userData.profileId,
      profileType: userData.profileType,
      isVerified: userData.isVerified || true,
      lastLogin: new Date().toISOString(),
      createdAt: userData.createdAt || new Date().toISOString()
    };
    
    setUser(debugUser);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('debugUser', JSON.stringify(debugUser));
    }
  };

  const clearDebugUser = () => {
    console.log('AuthContext: Clearing debug user');
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debugUser');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    setDebugUser,
    clearDebugUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 