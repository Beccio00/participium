import { Modal, Button } from "react-bootstrap";
import { ExclamationTriangleFill } from "react-bootstrap-icons";

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export default function ConfirmModal({
  show,
  onHide,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header 
        closeButton 
        style={{ 
          borderBottom: "none",
          paddingBottom: 0,
        }}
      >
        <Modal.Title 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          <ExclamationTriangleFill color="var(--primary)" size={24} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ paddingTop: "0.5rem" }}>
        <p style={{ 
          margin: 0, 
          color: "#495057",
          fontSize: "1rem",
          lineHeight: 1.5,
        }}>
          {message}
        </p>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "none", paddingTop: 0 }}>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          disabled={isLoading}
          style={{
            borderRadius: "8px",
            padding: "8px 20px",
          }}
        >
          {cancelText}
        </Button>
        <Button 
          variant={variant} 
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            borderRadius: "8px",
            padding: "8px 20px",
          }}
        >
          {isLoading ? "Loading..." : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
