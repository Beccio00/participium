import type { User } from './LoginTypes';
import type { SignupFormData, SignupResponse } from './SignupTypes';

export interface AuthUser extends User {}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (formData: SignupFormData) => Promise<SignupResponse>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: AuthUser;
}