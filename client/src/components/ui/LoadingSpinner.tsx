import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const bsSize = size === "sm" ? "sm" : undefined;
  const spinnerStyle = size === "lg" ? { width: '3rem', height: '3rem' } : undefined;

  return (
    <Spinner
      animation="border"
      role="status"
      size={bsSize}
      style={{ ...spinnerStyle, color: 'var(--primary)' }}
      className={className}
    >
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  );
}
