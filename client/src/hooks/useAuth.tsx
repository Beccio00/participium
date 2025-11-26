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
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await api.getSession();
      if (data.authenticated && data.user) {
        // if the user is a citizen, fetch the full citizen profile (includes photoUrl)
        if ((data.user as any).role === 'CITIZEN') {
          try {
            const profile = await api.getCitizenProfile();
            const u = (profile.user || profile) as any;
            setUser({ ...data.user, ...(u || {}) } as any);
          } catch (e) {
            // if fetching full profile fails, fallback to session user
            setUser(data.user as any);
          }
        } else {
          setUser(data.user as any);
        }
      } else setUser(null);
    } catch (err) {
      console.error('Error checking auth:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const signup = async (formData: SignupFormData): Promise<SignupResponse> => {
    return api.signup(formData);
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await api.login(email, password);
    // enrich citizen user with profile data (photoUrl)
    if ((data.user as any).role === 'CITIZEN') {
      try {
        const profile = await api.getCitizenProfile();
        const u = (profile.user || profile) as any;
        const merged = { ...data.user, ...(u || {}) } as any;
        setUser(merged);
        return merged;
      } catch (e) {
        setUser(data.user as any);
        return data.user as any;
      }
    }
    setUser(data.user as any);
    return data.user as any;
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}