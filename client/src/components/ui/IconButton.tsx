import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "default" | "danger" | "primary";
  size?: "sm" | "md" | "lg";
  label?: string;
}

const variantStyles: Record<string, CSSProperties> = {
  default: { color: "white" },
  danger: {},
  primary: {},
};

const sizeStyles: Record<string, CSSProperties> = {
  sm: { fontSize: "1rem", padding: "0.125rem" },
  md: { fontSize: "1.25rem", padding: "0.25rem" },
  lg: { fontSize: "1.5rem", padding: "0.375rem" },
};

export default function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  className = "",
  style,
  ...props
}: IconButtonProps) {
  const baseStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const variantClass =
    variant === "danger"
      ? "btn btn-sm btn-outline-danger border-0"
      : variant === "primary"
        ? "btn btn-sm btn-outline-primary border-0"
        : "";

  return (
    <button
      className={`${variantClass} ${className}`.trim()}
      style={baseStyle}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}
