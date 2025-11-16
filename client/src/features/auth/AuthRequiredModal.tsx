import { useNavigate } from "react-router";
import { LockFill } from "react-bootstrap-icons";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "../../components/ui/Modal.tsx";
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader icon={<LockFill />}>Authentication Required</ModalHeader>
      <ModalBody>
        <p>You need to be registered and logged in to submit reports to the municipality.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleLogin} fullWidth>
          Login
        </Button>
        <Button variant="secondary" onClick={handleSignup} fullWidth>
          Sign Up
        </Button>
      </ModalFooter>
    </Modal>
  );
}
