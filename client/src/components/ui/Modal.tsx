import { Modal as BSModal } from 'react-bootstrap';
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  backdropClassName = "",
}: ModalProps) {
  return (
    <BSModal 
      show={isOpen} 
      onHide={onClose} 
      centered 
      className={className}
      backdropClassName={backdropClassName}
      animation={true}
    >
      {children}
    </BSModal>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  icon?: ReactNode;
}

export function ModalHeader({ children, icon }: ModalHeaderProps) {
  return (
    <BSModal.Header closeButton>
      <BSModal.Title>
        {icon && <span className="me-2">{icon}</span>}
        {children}
      </BSModal.Title>
    </BSModal.Header>
  );
}

interface ModalBodyProps {
  children: ReactNode;
}

export function ModalBody({ children }: ModalBodyProps) {
  return <BSModal.Body>{children}</BSModal.Body>;
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <BSModal.Footer>{children}</BSModal.Footer>;
}
