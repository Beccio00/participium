import { useState } from 'react';
import type { 
  SignupFormData, 
  SignupResponse, 
  SignupErrorResponse,
  SignupFormErrors 
} from '../types/SignupTypes';
import Header from './Header';
import '../styles/Signup.css';

interface SignupProps {
  onBackToHome: () => void;
}

export default function Signup({ onBackToHome }: SignupProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const validateForm = (): SignupFormErrors => {
    const newErrors: SignupFormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name as keyof SignupFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
        general: undefined
      }));
    }
    
    // Show password requirements when user focuses on password field
    if (name === 'password') {
      setShowPasswordRequirements(value.length > 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
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
        const successData = data as SignupResponse;
        setSuccess(true);
        setFormData({ firstName: '', lastName: '', email: '', password: '' });
        console.log('Signup successful:', successData);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        
      } else {
        const errorData = data as SignupErrorResponse;
        
        // Handle specific error types
        if (response.status === 409) {
          setErrors({ email: 'This email is already registered. Try logging in instead.' });
        } else if (response.status === 400) {
          setErrors({ general: errorData.message || 'Please fill in all required fields correctly.' });
        } else {
          setErrors({ general: errorData.message || 'Registration failed. Please try again.' });
        }
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() && 
           formData.password.trim() &&
           Object.keys(errors).length === 0;
  };

  if (success) {
    return (
      <>
        <Header 
          userHeader={null}
          isAuthenticated={false}
          onShowLogin={() => {}}
          onShowSignup={() => {}}
          onLogout={async () => {}}
          showBackToHome={true}
          onBackToHome={onBackToHome}
        />
        <div className="signup-fullscreen">
          <div className="signup-card success-card">
            <h2>Registration Successful!</h2>
            <div className="success-message">
              <p>Your account has been created successfully.</p>
              <p>You will be redirected to the login page in a few seconds...</p>
            </div>
            <div className="signup-links">
              <a href="/login">Go to Login page now</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        userHeader={null}
        isAuthenticated={false}
        onShowLogin={() => {}}
        onShowSignup={() => {}}
        onLogout={async () => {}}
        showBackToHome={true}
        onBackToHome={onBackToHome}
      />
      <div className="signup-fullscreen">
      <div className="signup-card">
        <h2>Citizen Registration</h2>
        <p className="signup-subtitle">
          Register to access the Participium system and submit reports to your municipality.
        </p>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? 'error' : ''}
                disabled={loading}
                placeholder="Enter your first name"
                maxLength={50}
              />
              {errors.firstName && (
                <div className="field-error">{errors.firstName}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={errors.lastName ? 'error' : ''}
                disabled={loading}
                placeholder="Enter your last name"
                maxLength={50}
              />
              {errors.lastName && (
                <div className="field-error">{errors.lastName}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              disabled={loading}
              placeholder="Enter your email address"
              maxLength={100}
            />
            {errors.email && (
              <div className="field-error">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(formData.password.length > 0)}
              className={errors.password ? 'error' : ''}
              disabled={loading}
              placeholder="Choose a secure password"
              maxLength={100}
            />
            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
            <div className={`password-requirements ${showPasswordRequirements ? 'show' : 'hide'}`}>
              Password must be at least 8 characters long
            </div>
          </div>

          {errors.general && (
            <div className="error-message">
              {errors.general}
            </div>
          )}

          <button 
            type="submit" 
            className="signup-btn"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-links">
          <p>Already have an account? <a href="/login">Log in here</a></p>
        </div>
      </div>
    </div>
    </>
  );
}