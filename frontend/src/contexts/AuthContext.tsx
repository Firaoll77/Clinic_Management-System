'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  staffProfile?: {
    id: string;
    fullName: string;
    phone: string;
    specialization?: string;
  };
}

interface Session {
  id: string;
  device: string;
  lastActive: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  logoutAll: () => void;
  getSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    // Clear all local state immediately
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setLoading(false);
    setIsLoggedOut(true);

    // Redirect to login page
    router.push('/login');

    // Optionally call backend to revoke token (non-blocking, fire and forget)
    // Use setTimeout to ensure it doesn't block the UI
    setTimeout(() => {
      apiClient.post('/auth/logout').catch(err => {
        console.error('Logout API error (non-critical):', err);
      });
    }, 0);
  }, [router]);

  const logoutAll = useCallback(() => {
    // Clear all local state immediately
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setLoading(false);
    setIsLoggedOut(true);

    // Redirect to login page
    router.push('/login');

    // Optionally call backend to revoke all tokens (non-blocking, fire and forget)
    // Use setTimeout to ensure it doesn't block the UI
    setTimeout(() => {
      apiClient.post('/auth/logout-all').catch(err => {
        console.error('Logout all API error (non-critical):', err);
      });
    }, 0);
  }, [router]);

  const getSessions = useCallback(async () => {
    try {
      const response = await apiClient.get<{ sessions: Session[] }>('/auth/sessions');
      return response.data?.sessions || [];
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      return true;
    } catch (error) {
      console.error('Revoke session error:', error);
      return false;
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    // Don't fetch if there's no token in localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check authentication on mount by fetching user info
    // Cookies are automatically sent by the browser
    // Don't fetch if user has logged out
    if (!isLoggedOut) {
      fetchUserInfo();
    }
  }, [fetchUserInfo, isLoggedOut]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens?: {
          accessToken: string;
          refreshToken: string;
        };
      }>('/auth/login', { username, password });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: loggedInUser, tokens } = response.data;
        setUser(loggedInUser);
        setIsLoggedOut(false); // Reset logout flag on successful login

        // Fallback: store tokens in localStorage if cookies don't work
        if (tokens) {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }

        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    login,
    logout,
    logoutAll,
    getSessions,
    revokeSession,
    loading,
    isAuthenticated: !!user,
  }), [user, login, logout, logoutAll, getSessions, revokeSession, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
