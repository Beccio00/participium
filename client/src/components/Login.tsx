import { useState } from 'react';
import type { 
  LoginFormData, 
  LoginResponse, 
  SessionInfo, 
  ErrorResponse,
  User 
} from '../../../shared/LoginTypes';
import '../styles/Login.css';

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/session/current', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const sessionInfo: SessionInfo = await response.json();
        if (sessionInfo.authenticated && sessionInfo.user) {
          setUser(sessionInfo.user);
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
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
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(formData),
      });

      const data: LoginResponse | ErrorResponse = await response.json();

      if (response.ok) {
        const successData = data as LoginResponse;
        setUser(successData.user);
        setFormData({ email: '', password: '' });
        console.log('Login successful:', successData);
      } else {
        const errorData = data as ErrorResponse;
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
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
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
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
          <p>Don't have an account? <a href="/signup">Sign up here</a></p>
        </div>
      </div>
    </div>
  );
}