import { useState } from 'react';
import {useAuth} from '../hooks/useAuth';
import {LoginValidator} from '../validators/LoginValidator';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons'
import Header from './Header';
import type { 
  LoginFormData,
  User 
} from '../../../shared/LoginTypes';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoToSignup: () => void;
  onBackToHome: () => void;
}

export default function Login({onLoginSuccess, onGoToSignup, onBackToHome}: LoginProps) {
  const{login,checkAuth} = useAuth(); 
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const checkSession = async () => {
    try {
       await checkAuth();
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    //want to "clear" the error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const validationResult = LoginValidator.validate(formData);
    if (!validationResult.isValid) {
      setError(validationResult.errors.email || validationResult.errors.password || '');
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      onLoginSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    checkSession();
  });

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
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={togglePasswordVisibility}
            >{showPassword ? <EyeSlashFill /> : <EyeFill />}</button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-links">
          <p>Don't have an account? 
            <button 
              onClick={onGoToSignup} 
              className="link-button"
              disabled={loading}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}