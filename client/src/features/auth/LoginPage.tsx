import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import { Button, Input } from "../../components/ui";
import { LoginValidator } from "../../validators/LoginValidator";
import type { LoginFormData } from "../../../../shared/LoginTypes";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadingState, setLoading, setError, setIdle } = useLoadingState();

  const handleLogin = async (values: LoginFormData) => {
    setLoading();
    try {
      const response = await login(values.email, values.password);
      if (response && response.role === "ADMINISTRATOR") {
        navigate("/admin", { replace: true });
      } else {
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
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={form.handleSubmit} className="login-form">
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

        <div className="login-links">
          <p>
            Don't have an account? <br />
            <button
              onClick={() => navigate("/signup")}
              className="link-btn"
              disabled={loadingState === "loading"}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
