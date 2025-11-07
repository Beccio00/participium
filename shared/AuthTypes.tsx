export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: AuthUser;
}