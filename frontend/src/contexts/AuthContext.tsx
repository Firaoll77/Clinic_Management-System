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

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    apiClient.clearToken();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      apiClient.setToken(storedToken);
      // Verify token by fetching user info
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, [fetchUserInfo]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/login', { username, password });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: loggedInUser, tokens } = response.data;
        setUser(loggedInUser);
        setToken(tokens.accessToken);
        apiClient.setToken(tokens.accessToken);
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
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
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  }), [user, token, login, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
