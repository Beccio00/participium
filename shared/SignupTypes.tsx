export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
}

export interface SignupErrorResponse {
  error: string;
  message: string;
}

export interface SignupFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  general?: string;
}