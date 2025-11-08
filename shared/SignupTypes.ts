import type { User, ErrorResponse } from './LoginTypes';

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse extends User {}

export interface SignupErrorResponse extends ErrorResponse {}

export interface SignupFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export interface SignupValidationResult {
  isValid: boolean;
  errors: SignupFormErrors;
}