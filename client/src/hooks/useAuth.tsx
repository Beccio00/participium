import { useState, useEffect } from 'react';
import type { AuthUser } from '../../../shared/AuthTypes';
import type { SignupFormData, SignupResponse } from '../../../shared/SignupTypes';
import * as api from '../api/api';

export function useAuth() {
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

  const login = async (email: string, password: string): Promise<void> => {
    const data = await api.login(email, password);
    setUser(data.user);
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

  return {
    user,
    isAuthenticated: !!user,
    loading,
    signup,
    login,
    logout,
    checkAuth
  };
}