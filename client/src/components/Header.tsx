import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { MUNICIPALITY_ROLES, getRoleLabel } from '../utils/roles';
import { PersonCircle } from 'react-bootstrap-icons';


interface HeaderProps {
  showBackToHome?: boolean;
}

export default function Header({ showBackToHome = false }: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => navigate('/login')
  const handleGoToSignup = () => navigate('/signup')
  const handleBackHome = () => {
    if (user?.role === 'ADMINISTRATOR') {
      handleLogout();
    } else {
      navigate('/');
    }
  }

  const navbarStyle = {
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--navbar-accent) 85%, var(--primary) 15%) 0%, color-mix(in srgb, var(--navbar-accent) 60%, var(--stone) 40%) 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)',
    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'saturate(120%) blur(2px)',
    height: '80px',
  };

  const userAvatarStyle = {
    fontSize: '2rem',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    borderRadius: '50%',
    color: 'rgba(255, 255, 255, 0.95)',
  };

  const userNameStyle = {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'white',
    margin: 0,
  };

  const userSurnameStyle = {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
  };

  return (
    <Navbar 
      fixed="top" 
      expand="md" 
      style={navbarStyle}
    >
      <Container fluid className="px-4" style={{ maxWidth: '1200px', height: '100%' }}>
        <Navbar.Brand className="text-white">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Participium</h1>
            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 400 }}>
              Digital Citizen Participation
            </span>
          </div>
        </Navbar.Brand>
        
        <Nav className="ms-auto align-items-center">
          {showBackToHome ? (
            <Button 
              onClick={handleBackHome}
              disabled={loading}
              variant="light"
              size="sm"
              className="fw-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {user?.role === 'ADMINISTRATOR' 
                ? (loading ? 'Logging out...' : 'Logout') 
                : '← Back to Home'}
            </Button>
          ) : isAuthenticated && user ? (
            <div className="d-flex align-items-center gap-3">
              {MUNICIPALITY_ROLES.includes(user.role) && (
                <Badge 
                  bg="dark" 
                  className="bg-opacity-25"
                  style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                >
                  {getRoleLabel(user.role as string)}
                </Badge>
              )}
              <div style={userAvatarStyle}><PersonCircle /></div>
              <div className="d-flex flex-column me-4">
                <div style={userNameStyle}>{user.firstName}</div>
                <div style={userSurnameStyle}>{user.lastName}</div>
              </div>
              <Button 
                onClick={handleLogout}
                disabled={loading}
                variant="light"
                size="sm"
                className="fw-semibold"
                style={{ color: 'var(--primary)' }}
              >
                {loading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Button onClick={handleGoToLogin} variant="light" size="sm" className="fw-semibold" style={{ color: 'var(--primary)' }}>
                Login
              </Button>
              <Button onClick={handleGoToSignup} variant="light" size="sm" className="fw-semibold" style={{ color: 'var(--primary)' }}>
                Sign Up
              </Button>
            </div>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}