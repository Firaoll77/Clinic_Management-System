'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';

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
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  getSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Cookies are cleared by the backend
      setLoading(false);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      setUser(null);
      // Cookies are cleared by the backend
      setLoading(false);
    }
  }, []);

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
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // Try to refresh token automatically
      try {
        await apiClient.post('/auth/refresh');
        // Retry fetching user info after refresh
        const userResponse = await apiClient.get<{ user: User }>('/auth/me');
        if (userResponse.data?.user) {
          setUser(userResponse.data.user);
        } else {
          setUser(null);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check authentication on mount by fetching user info
    // Cookies are automatically sent by the browser
    fetchUserInfo();
     
  }, [fetchUserInfo]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
      }>('/auth/login', { username, password });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: loggedInUser } = response.data;
        setUser(loggedInUser);
        // Cookies are set by the backend
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
