import { useState } from 'react';
import {useAuth} from '../hooks/useAuth';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons'
import type { 
  LoginFormData,
  ErrorResponse,
  User 
} from '../../../shared/LoginTypes';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoToSignup: () => void;
}

export default function Login({onLoginSuccess, onGoToSignup}: LoginProps) {
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
  
  useState(() => {
    checkSession();
  });


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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/session/current', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        console.log('Logout successful');
      } else {
        const errorData: ErrorResponse = await response.json();
        setError(errorData.message || 'Logout failed');
      }
    } catch (err) {
      setError('Network error during logout');
      console.error('Logout error:', err);
    }
  };

  //when user already logged, show info and logout button
  if (user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Welcome back!</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.telegramUsername && (
              <p><strong>Telegram:</strong> {user.telegramUsername}</p>
            )}
            <p><strong>Email Notifications:</strong> {user.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="logout-btn"
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    );
  }

  return (
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
  );
}