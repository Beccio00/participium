import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  type,
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        <input
          id={inputId}
          type={inputType}
          className={`input-field ${error ? "input-field--error" : ""} ${isPassword ? "input-field--password" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeSlashFill /> : <EyeFill />}
          </button>
        )}
      </div>
      {error && <div className="input-error">{error}</div>}
      {helperText && !error && (
        <div className="input-helper">{helperText}</div>
      )}
    </div>
  );
}
