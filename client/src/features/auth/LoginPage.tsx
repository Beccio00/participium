import { Container } from 'react-bootstrap';
import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { LoginValidator } from "../../validators/LoginValidator";
import type { LoginFormData } from "../../../../shared/LoginTypes";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadingState, setLoading, setError, setIdle } = useLoadingState();

  const handleLogin = async (values: LoginFormData) => {
    setLoading();
    try {
      const response = await login(values.email, values.password);
      if (response && response.role === "ADMINISTRATOR") {
        navigate("/admin", { replace: true });
      } else if (response && response.role === "TECHNICAL_OFFICE") {
        navigate("/technician", { replace: true });
      } 
      else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError();
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during login";
      form.setFieldError("email", errorMessage);
    } finally {
      setIdle();
    }
  };

  const form = useForm<LoginFormData>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: (values) => {
      const result = LoginValidator.validate(values);
      if (!result.isValid) {
        return result.errors as Partial<Record<keyof LoginFormData, string>>;
      }
      return {};
    },
    onSubmit: handleLogin,
  });

  const isFormDisabled = loadingState === "loading" || !form.values.email || !form.values.password;

  return (
    <div className="login-container">
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="login-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '3rem',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(34, 49, 63, 0.12)',
          width: '100%',
          maxWidth: '450px'
        }}>
          <h2 className="text-center mb-4" style={{ color: 'var(--text)', fontWeight: 700 }}>Login</h2>

          <form onSubmit={form.handleSubmit}>
            <Input
              type="email"
              id="email"
              name="email"
              label="Email"
              value={form.values.email}
              onChange={form.handleChange}
              error={form.errors.email}
              disabled={loadingState === "loading"}
              placeholder="Enter your email"
              required
              className="mb-3"
            />

            <Input
              type="password"
              id="password"
              name="password"
              label="Password"
              value={form.values.password}
              onChange={form.handleChange}
              error={form.errors.password}
              disabled={loadingState === "loading"}
              placeholder="Enter your password"
              required
              className="mb-4"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isFormDisabled}
              isLoading={loadingState === "loading"}
            >
              {loadingState === "loading" ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
              Don't have an account?
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="btn btn-link p-0"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
              disabled={loadingState === "loading"}
            >
              Sign up here
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
