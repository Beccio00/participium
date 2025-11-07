import type { LoginFormData, ValidationResult } from '../../../shared/LoginTypes';


export const LoginValidator = {

    //teoretically the control on the field required is reduntant 
    //since the button is disabled until both fields are filled
    //but it's better to have multiple layers of validation
  validate(formData: LoginFormData): ValidationResult {
    const errors: ValidationResult['errors'] = {};

    //email
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    //password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 1) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  //utility function to validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },


};

export default LoginValidator;