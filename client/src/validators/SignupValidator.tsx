import type { 
  SignupFormData,
  SignupFormErrors,
  SignupValidationResult 
} from '../../../shared/SignupTypes';

export const SignupValidator = {

    //teoretically the control on the field required is reduntant 
    //since the button is disabled until both fields are filled
    //but it's better to have multiple layers of validation 
  validate(formData: SignupFormData): SignupValidationResult {
    const errors: SignupFormErrors = {};

    //first name
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    //last name
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

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
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

export default SignupValidator;