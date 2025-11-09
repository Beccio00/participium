import { useState } from 'react';
import { useNavigate } from 'react-router';
import '../styles/Header.css';
import { useAuth } from '../hooks/useAuth';
import { PersonCircle } from 'react-bootstrap-icons';

interface HeaderProps {
  onLogout?: () => Promise<void>;
  showBackToHome?: boolean;
}

export default function Header({ onLogout, showBackToHome = false }: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      if (onLogout) await onLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => navigate('/login')
  const handleGoToSignup = () => navigate('/signup')
  const handleBackHome = () => navigate('/')

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <h1>Participium</h1>
          <span className="subtitle">Digital Citizen Participation</span>
        </div>
        
        <div className="auth-section">
          {showBackToHome ? (
            <button 
              onClick={handleBackHome}
              className="header-btn"
            >
              ← Back to Home
            </button>
          ) : isAuthenticated && user ? (
            <div className="user-menu">
              <div className="user-profile">
                <div className="user-avatar"><PersonCircle /></div>
                <div className="user-details">
                  <div className="user-name">{user.firstName}</div>
                  <div className="user-surname">{user.lastName}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  disabled={loading}
                  className="logout-btn"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
              ) : (
            <div className="auth-buttons">
              <button onClick={handleGoToLogin} className="header-btn">Login</button>
              <button onClick={handleGoToSignup} className="header-btn">Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}