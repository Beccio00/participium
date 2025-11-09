//Here we have to implement the interface useful whether client or server

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
  };
}

export interface SessionInfo {
  authenticated: boolean;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
  };
}
export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
  };
}

