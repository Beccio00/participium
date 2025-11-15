import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useForm } from "../../hooks";
import { Button, Input } from "../../components/ui";
import { SignupValidator } from "../../validators/SignupValidator";
import type { SignupFormData } from "../../../../shared/SignupTypes";
import "./SignupPage.css";

export function SignupPage() {
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
        <div className="signup-card success-card">
          <h2>Registration Successful!</h2>
          <div className="success-message">
            <p>Your account has been created successfully.</p>
          </div>
          <div className="signup-links">
            <button type="button" className="link-btn" onClick={() => navigate("/login")}>
              Click here to Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-fullscreen">
      <div className="signup-card">
        <h2>Citizen Registration</h2>
        <p className="signup-subtitle">
          Register to access the Participium system and submit reports to your municipality.
        </p>

        <form onSubmit={form.handleSubmit} className="signup-form">
          <div className="form-row">
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
          </div>

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
          />

          <Button type="submit" variant="primary" fullWidth disabled={form.isSubmitting || !isFormValid} isLoading={form.isSubmitting}>
            {form.isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="signup-links">
          <p>
            Already have an account? <br />
            <button type="button" className="link-btn" onClick={() => navigate("/login")}>
              Click here to Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
