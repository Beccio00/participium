import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '../../../shared/AuthTypes';
import type { SignupFormData, SignupResponse } from '../../../shared/SignupTypes';
import * as api from '../api/api';

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (formData: SignupFormData) => Promise<SignupResponse>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await api.getSession();
      if (data.authenticated && data.user) setUser(data.user);
      else setUser(null);
    } catch (err) {
      console.error('Error checking auth:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData: SignupFormData): Promise<SignupResponse> => {
    return api.signup(formData);
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}