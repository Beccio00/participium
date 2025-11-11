import '../styles/AuthModal.css';
import { LockFill, GearFill } from 'react-bootstrap-icons';

interface AuthModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
}

export default function AuthModal({ isOpen, isAuthenticated, onClose, onLogin, onSignup }: AuthModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal">
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-content">
          {!isAuthenticated ? (
            // Contenuto per utenti non autenticati
            <>
              <div className="modal-icon"><LockFill /></div>
              <h2>Authentication Required</h2>
              <p>You need to be registered and logged in to submit reports to the municipality.</p>
              
              <div className="modal-buttons">
                <button 
                  onClick={onLogin}
                  className="modal-btn login-modal-btn"
                >
                  Login
                </button>
                <button 
                  onClick={onSignup}
                  className="modal-btn signup-modal-btn"
                >
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            // Contenuto per utenti autenticati
            <>
              <div className="modal-icon"><GearFill /></div>
              <h2>Feature Coming Soon</h2>
              <p>The report submission functionality is currently under development and will be available soon.</p>
              
              <div className="modal-buttons">
                <button 
                  onClick={onClose}
                  className="modal-btn login-modal-btn"
                >
                  Got it
                </button>
              </div>
              
              <p className="modal-footer">
                Thank you for your patience as we work to improve the platform.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}