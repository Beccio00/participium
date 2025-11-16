import { useNavigate } from "react-router";
import { LockFill } from "react-bootstrap-icons";
import Modal from "../../components/ui/Modal.tsx";
import Button from "../../components/ui/Button.tsx";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  const handleSignup = () => {
    onClose();
    navigate("/signup");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdropClassName="modal-backdrop-blur">
      <div style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--text)',
            opacity: 0.5,
            lineHeight: 1,
            padding: 0,
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        {/* Large centered lock icon */}
        <div style={{ 
          fontSize: '4rem', 
          color: 'var(--primary)', 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <LockFill />
        </div>

        {/* Title */}
        <h2 style={{ 
          color: 'var(--text)', 
          fontSize: '1.5rem', 
          fontWeight: 600,
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Authentication Required
        </h2>

        {/* Description */}
        <p style={{ 
          color: 'var(--text)', 
          fontSize: '1rem',
          marginBottom: '2rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          You need to be registered and logged in to submit reports to the municipality.
        </p>

        {/* Buttons side by side */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button variant="primary" onClick={handleLogin} style={{ minWidth: '120px' }}>
            Login
          </Button>
          <Button variant="primary" onClick={handleSignup} style={{ minWidth: '120px' }}>
            Sign Up
          </Button>
        </div>
      </div>
    </Modal>
  );
}
