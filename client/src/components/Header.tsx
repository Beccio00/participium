import { use, useState } from 'react';
import type { AuthUser } from '../../../shared/AuthTypes';
import { useAuth } from '../hooks/useAuth';
import '../styles/Header.css';

interface HeaderProps {
  userHeader: AuthUser | null;
  isAuthenticated: boolean;
  onShowLogin: () => void;
  onShowSignup: () => void;
  onLogout: () => Promise<void>;
  showBackToHome?: boolean;
  onBackToHome?: () => void;
}

export default function Header({ 
  userHeader ,
  isAuthenticated , 
  onShowLogin, 
  onShowSignup, 
  onLogout,
  showBackToHome = false,
  onBackToHome
}: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={onBackToHome}
              className="header-btn"
            >
              ← Back to Home
            </button>
          ) : isAuthenticated && user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="user-role">{user.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="header-btn"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                onClick={onShowLogin}
                className="header-btn"
              >
                Login
              </button>
              <button 
                onClick={onShowSignup}
                className="header-btn"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}