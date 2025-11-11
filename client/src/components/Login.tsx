import { useState } from 'react';
import { useNavigate } from 'react-router'
import {useAuth} from '../hooks/useAuth';
import {LoginValidator} from '../validators/LoginValidator';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons'
import type { LoginFormData } from '../../../shared/LoginTypes';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const response = await login(formData.email, formData.password);
      if (response && response.role === 'ADMINISTRATOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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


  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          
          <div className="test-accounts-info">
            <p><strong>Test Accounts:</strong></p>
            <ul>
              <li><strong>Admin:</strong> admin@participium.com / adminpass</li>
              <li><strong>Citizen:</strong> citizen@participium.com / citizenpass</li>
              <li><strong>Public Relations:</strong> pr@participium.com / prpass</li>
              <li><strong>Technical Office:</strong> tech@participium.com / techpass</li>
            </ul>
          </div>

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
          <p>Don't have an account?  <br />
            <button 
              onClick={() => navigate('/signup')} 
              className="link-btn"
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