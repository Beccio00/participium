import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`spinner spinner--${size} ${className}`} role="status" aria-label="Loading">
      <div className="spinner-circle"></div>
    </div>
  );
}
