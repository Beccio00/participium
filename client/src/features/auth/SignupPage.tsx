import { useState } from "react";
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from "react-router";
import { useAuth, useForm } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { SignupValidator } from "../../validators/SignupValidator";
import type { SignupFormData } from "../../../../shared/SignupTypes";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleSignup = async (values: SignupFormData) => {
    try {
      await signup(values);
      setSuccess(true);
      form.resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";

      if (errorMessage.includes("Email already in use") || errorMessage.includes("already registered")) {
        form.setFieldError("email", "This email is already registered. Try logging in instead.");
      } else if (errorMessage.includes("Missing required fields")) {
        form.setFieldError("email", "Please fill in all required fields correctly.");
      } else {
        form.setFieldError("email", errorMessage);
      }
    }
  };

  const form = useForm<SignupFormData>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    validate: (values) => {
      const result = SignupValidator.validate(values);
      if (!result.isValid) {
        return result.errors as Partial<Record<keyof SignupFormData, string>>;
      }
      return {};
    },
    onSubmit: handleSignup,
  });

  const isFormValid =
    form.values.firstName.trim() &&
    form.values.lastName.trim() &&
    form.values.email.trim() &&
    form.values.password.trim() &&
    Object.keys(form.errors).length === 0;

  if (success) {
    return (
      <div className="signup-fullscreen">
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '3rem',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(34, 49, 63, 0.12)',
            width: '100%',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 className="mb-4" style={{ color: 'var(--text)', fontWeight: 700 }}>Registration Successful!</h2>
            <p className="mb-4" style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
              Your account has been created successfully.
            </p>
            <button
              type="button"
              className="btn btn-link"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem' }}
              onClick={() => navigate("/login")}
            >
              Click here to Log In
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="signup-fullscreen">
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '3rem',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(34, 49, 63, 0.12)',
          width: '100%',
          maxWidth: '600px'
        }}>
          <h2 className="text-center mb-2" style={{ color: 'var(--text)', fontWeight: 700 }}>Citizen Registration</h2>
          <p className="text-center mb-4" style={{ color: 'var(--muted)' }}>
            Register to access the Participium system and submit reports to your municipality.
          </p>

          <form onSubmit={form.handleSubmit}>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  label="First Name *"
                  value={form.values.firstName}
                  onChange={form.handleChange}
                  error={form.errors.firstName}
                  disabled={form.isSubmitting}
                  placeholder="Enter your first name"
                  maxLength={50}
                />
              </Col>

              <Col md={6}>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  label="Last Name *"
                  value={form.values.lastName}
                  onChange={form.handleChange}
                  error={form.errors.lastName}
                  disabled={form.isSubmitting}
                  placeholder="Enter your last name"
                  maxLength={50}
                />
              </Col>
            </Row>

            <Input
              type="email"
              id="email"
              name="email"
              label="Email Address *"
              value={form.values.email}
              onChange={form.handleChange}
              error={form.errors.email}
              disabled={form.isSubmitting}
              placeholder="Enter your email address"
              maxLength={100}
              className="mb-3"
            />

            <Input
              type="password"
              id="password"
              name="password"
              label="Password *"
              value={form.values.password}
              onChange={form.handleChange}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(form.values.password.length > 0)}
              error={form.errors.password}
              disabled={form.isSubmitting}
              placeholder="Choose a secure password"
              maxLength={100}
              helperText={showPasswordRequirements ? "Password must be at least 8 characters long" : undefined}
              className="mb-4"
            />

            <Button type="submit" variant="primary" fullWidth disabled={form.isSubmitting || !isFormValid} isLoading={form.isSubmitting}>
              {form.isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
              Already have an account?
            </p>
            <button
              type="button"
              className="btn btn-link p-0"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
              onClick={() => navigate("/login")}
            >
              Click here to Log In
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
