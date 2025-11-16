import { Button as BSButton, Spinner } from 'react-bootstrap';
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const bsVariant = variant === "ghost" ? "outline-primary" : variant;
  const bsSize = size === "md" ? undefined : size;

  return (
    <BSButton
      variant={bsVariant}
      size={bsSize}
      disabled={disabled || isLoading}
      className={fullWidth ? `w-100 ${className}` : className}
      type={type}
      {...props}
    >
      {isLoading && (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          Loading...
        </>
      )}
      {!isLoading && children}
    </BSButton>
  );
}
