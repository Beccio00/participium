import { useState, useEffect } from 'react';
import type { AuthUser } from '../../../shared/AuthTypes';
import type { LoginResponse, ErrorResponse } from '../../../shared/LoginTypes';
import type { SignupFormData, SignupResponse, SignupErrorResponse } from '../../../shared/SignupTypes';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/session/current', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData: SignupFormData): Promise<SignupResponse> => {
    const response = await fetch('/api/citizen/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    const data: SignupResponse | SignupErrorResponse = await response.json();

    if (response.ok) {
      return data as SignupResponse;
    } else {
      const errorData = data as SignupErrorResponse;
      throw new Error(errorData.message || 'Signup failed');
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data: LoginResponse | ErrorResponse = await response.json();

    if (response.ok) {
      const successData = data as LoginResponse;
      setUser(successData.user);
    } else {
      const errorData = data as ErrorResponse;
      throw new Error(errorData.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/session/current', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
      } else {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
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