import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { MUNICIPALITY_ROLES, getRoleLabel } from '../utils/roles';
import { PersonCircle, ArrowLeft } from 'react-bootstrap-icons';


interface HeaderProps {
  showBackToHome?: boolean;
}

export default function Header({ showBackToHome = false }: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

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
    if (user?.role === 'ADMINISTRATOR' || user?.role === 'TECHNICAL_OFFICE') {
      handleLogout();
    } else {
      navigate('/');
    }
  }

  const navbarStyle = {
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--navbar-accent) 85%, var(--primary) 15%) 0%, color-mix(in srgb, var(--navbar-accent) 60%, var(--stone) 40%) 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)',
    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'saturate(120%) blur(2px)',
    minHeight: '60px',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
  };

  const buttonStyle = {
    padding: '0.375rem 1rem',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap' as const,
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
      sticky="top" 
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      style={navbarStyle}
    >
      <Container fluid className="px-3 px-md-4" style={{ maxWidth: '1200px' }}>
        <div className="d-flex align-items-center justify-content-between w-100" style={{ minHeight: '60px' }}>
          <Navbar.Brand className="text-white mb-0">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h1 className="mb-0" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: 700, lineHeight: 1.1 }}>
                Participium
              </h1>
              <span style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)', opacity: 0.9, fontWeight: 400, lineHeight: 1.2 }}>
                Digital Citizen Participation
              </span>
            </div>
          </Navbar.Brand>
        
          {/* User info visible always on desktop and mobile, outside the burger */}
          {isAuthenticated && user && !showBackToHome && (
            <div className="d-flex align-items-center gap-2 d-lg-none">
              <div className="d-flex align-items-center gap-2">
                <div style={{...userAvatarStyle, fontSize: '1.5rem', width: '32px', height: '32px'}}><PersonCircle /></div>
                <div className="d-flex flex-column">
                  <div style={{...userNameStyle, fontSize: '0.85rem'}}>{user.firstName}</div>
                  <div style={{...userSurnameStyle, fontSize: '0.75rem'}}>{user.lastName}</div>
                </div>
              </div>
            </div>
          )}
          
          {showBackToHome && location.pathname !== '/admin' ? (
            <button
              onClick={handleBackHome}
              disabled={loading}
              className="d-lg-none border-0 bg-transparent d-flex align-items-center justify-content-center"
              style={{ 
                color: 'white', 
                fontSize: '1.5rem',
                padding: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <Navbar.Toggle aria-controls="navbar-nav" className="d-lg-none border-0 d-flex align-items-center justify-content-center" style={{ color: 'white', padding: '0.5rem' }}>
              <span style={{ color: 'white', fontSize: '1.5rem', lineHeight: 1 }}>☰</span>
            </Navbar.Toggle>
          )}
        </div>

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-lg-center mt-3 mt-lg-0">
            {showBackToHome && user?.role === 'ADMINISTRATOR' ? (
              <>
                {/* Logout button for admin both mobile and desktop */}
                <Button 
                  onClick={handleLogout}
                  disabled={loading}
                  variant="light"
                  size="sm"
                  className="fw-semibold"
                  style={{ ...buttonStyle, color: 'var(--primary)' }}
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            ) : showBackToHome ? (
              <Button 
                onClick={handleBackHome}
                disabled={loading}
                variant="light"
                size="sm"
                className="fw-semibold d-none d-lg-block"
                style={{ ...buttonStyle, color: 'var(--primary)' }}
              >
                {user?.role=="ADMINISTRATOR" || user?.role=="TECHNICAL_OFFICE" ? 'Logout' : '← Back to Home'}
              </Button>
            ) : isAuthenticated && user ? (
              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                {/* User info only on desktop in the collapse */}
                <div className="d-none d-lg-flex flex-lg-row align-items-lg-center gap-3">
                  {MUNICIPALITY_ROLES.includes(user.role) && (
                    <Badge 
                      bg="dark" 
                      className="bg-opacity-25"
                      style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                    >
                      {getRoleLabel(user.role as string)}
                    </Badge>
                  )}
                  <div className="d-flex align-items-center gap-2">
                    <div style={userAvatarStyle}><PersonCircle /></div>
                    <div className="d-flex flex-column">
                      <div style={userNameStyle}>{user.firstName}</div>
                      <div style={userSurnameStyle}>{user.lastName}</div>
                    </div>
                  </div>
                </div>
                {/* Logout button */}
                <Button 
                  onClick={handleLogout}
                  disabled={loading}
                  variant="light"
                  size="sm"
                  className="fw-semibold ms-lg-3"
                  style={{ ...buttonStyle, color: 'var(--primary)' }}
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Button 
                  onClick={handleGoToLogin} 
                  variant="light" 
                  size="sm" 
                  className="fw-semibold" 
                  style={{ ...buttonStyle, color: 'var(--primary)' }}
                >
                  Login
                </Button>
                <Button 
                  onClick={handleGoToSignup} 
                  variant="light" 
                  size="sm" 
                  className="fw-semibold" 
                  style={{ ...buttonStyle, color: 'var(--primary)' }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}