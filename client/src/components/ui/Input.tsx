import { useState } from "react";
import { Form, InputGroup } from 'react-bootstrap';
import type { FormControlProps } from 'react-bootstrap';
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";

interface InputProps extends Omit<FormControlProps, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
}

export default function Input({
  label,
  error,
  helperText,
  type = "text",
  className = "",
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <Form.Group className={className}>
      {label && <Form.Label htmlFor={inputId}>{label}</Form.Label>}
      {isPassword ? (
        <InputGroup>
          <Form.Control
            id={inputId}
            type={inputType}
            isInvalid={!!error}
            {...props}
          />
          <InputGroup.Text
            onClick={() => setShowPassword(!showPassword)}
            style={{
              cursor: 'pointer',
              backgroundColor: 'white',
              borderLeft: 'none',
              color: 'var(--primary)'
            }}
          >
            {showPassword ? <EyeSlashFill /> : <EyeFill />}
          </InputGroup.Text>
        </InputGroup>
      ) : (
        <Form.Control
          id={inputId}
          type={inputType}
          isInvalid={!!error}
          {...props}
        />
      )}
      {error && (
        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
          {error}
        </Form.Control.Feedback>
      )}
      {helperText && !error && (
        <Form.Text className="text-muted">{helperText}</Form.Text>
      )}
    </Form.Group>
  );
}
