import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, AuthContextType } from '@/types';
import { authAPI, setRuntimeAuthToken } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const authRequestVersionRef = useRef(0);

  const beginAuthRequest = () => {
    authRequestVersionRef.current += 1;
    return authRequestVersionRef.current;
  };

  const isLatestAuthRequest = (requestVersion: number) => {
    return requestVersion === authRequestVersionRef.current;
  };

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const requestVersion = beginAuthRequest();

    try {
      const response = await authAPI.getUser();
      if (!isLatestAuthRequest(requestVersion)) return;
      setUser(response?.user || null);
    } catch (error: any) {
      if (!isLatestAuthRequest(requestVersion)) return;

      // 401 is expected when the user is not authenticated.
      if (error?.response?.status !== 401) {
        console.error('Error fetching user:', error);
      }
      setUser(null);
    } finally {
      if (isLatestAuthRequest(requestVersion)) {
        setLoading(false);
      }
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // Invalidate in-flight auth checks so stale 401 responses cannot overwrite a fresh login.
      beginAuthRequest();

      // Clear any old session/token data first
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      setRuntimeAuthToken(null);

      // Get fresh CSRF token
      await authAPI.getCSRF();

      const userData = await authAPI.login(email, password);
      setRuntimeAuthToken(userData?.access_token || null);
      setUser(userData.user);

      return userData.user;
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      setRuntimeAuthToken(null);
      // Re-throw error so components can handle email_not_verified case
      throw error;
    }
  };

  const register = async (userData: Partial<User>, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await authAPI.getCSRF();

      await authAPI.register(userData, password);
      // Do not auto-fetch user after registration; email verification is required.
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      beginAuthRequest();
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      setRuntimeAuthToken(null);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const { user: updated } = await authAPI.updateProfile(updates);
      setUser(updated);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    const requestVersion = beginAuthRequest();

    try {
      const response = await authAPI.getUser();
      if (!isLatestAuthRequest(requestVersion)) return;
      setUser(response?.user || null);
    } catch (error: any) {
      if (!isLatestAuthRequest(requestVersion)) return;

      if (error?.response?.status !== 401) {
        console.error('Error refreshing user:', error);
      }

      if (error?.response?.status === 401) {
        setUser(null);
      }
    }
  };

  const ensureAuthenticated = async (): Promise<boolean> => {
    if (user) return true;

    const requestVersion = beginAuthRequest();

    try {
      const response = await authAPI.getUser();
      if (!isLatestAuthRequest(requestVersion)) {
        return false;
      }

      if (response?.user) {
        setUser(response.user);
        return true;
      }

      return false;
    } catch (error: any) {
      if (!isLatestAuthRequest(requestVersion)) {
        return false;
      }

      if (error?.response?.status === 401) {
        setUser(null);
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, refreshUser, ensureAuthenticated }}>
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
