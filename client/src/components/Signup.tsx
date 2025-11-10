import { useState } from 'react';
import { useNavigate } from 'react-router'
import type { 
  SignupFormData, 
  SignupFormErrors 
} from '../../../shared/SignupTypes';
import { SignupValidator } from '../validators/SignupValidator';
import { useAuth } from '../hooks/useAuth';
import '../styles/Signup.css';

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth();
  
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
    
    //client-side validation
    const validationResult = SignupValidator.validate(formData);
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const result = await signup(formData);
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      console.log('Signup successful:', result);
      
    } catch (err) {
      // Handle errors thrown by the signup function
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Map specific error messages to form fields if possible
      if (errorMessage.includes('Email already in use') || errorMessage.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Try logging in instead.' });
      } else if (errorMessage.includes('Missing required fields')) {
        setErrors({ general: 'Please fill in all required fields correctly.' });
      } else {
        setErrors({ general: errorMessage });
      }
      
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    const hasAllFields = formData.firstName.trim() && 
                        formData.lastName.trim() && 
                        formData.email.trim() && 
                        formData.password.trim();
    
    // Check if there are any actual error messages (not undefined)
    const hasErrors = Object.values(errors).some(error => error !== undefined && error !== '');
    
    return hasAllFields && !hasErrors;
  };

  if (success) {
    return (
      <>
        <div className="signup-fullscreen">
          <div className="signup-card success-card">
            <h2>Registration Successful!</h2>
            <div className="success-message">
              <p>Your account has been created successfully.</p>
            </div>
        <div className="signup-links">
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate('/login')}
               >Click here to Log In</button>
        </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header is rendered by App; navigation handled locally */}
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
      <p>Already have an account? <br /> <button
          type="button"
          className="link-btn"
          onClick={() => navigate('/login')}
            >Click here to Log In
            </button></p>
        </div>
      </div>
    </div>
    </>
  );
}