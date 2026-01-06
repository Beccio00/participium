import { useNavigate } from "react-router";
import { Container } from "react-bootstrap";
import { LockFill } from "react-bootstrap-icons";
import Button from "./ui/Button";

interface AccessRestrictedProps {
  message: string;
  showLoginButton?: boolean;
}

export default function AccessRestricted({ 
  message, 
  showLoginButton = false 
}: AccessRestrictedProps) {
  const navigate = useNavigate();

  return (
    <Container className="py-5">
      <div
        style={{
          margin: "8rem auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "2.5rem",
            color: "var(--primary)",
            marginBottom: "1.5rem",
          }}
        >
          <LockFill size={64} />
        </div>
        <h2
          style={{
            color: "var(--text)",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            color: "#6c757d",
            fontSize: "1.1rem",
            marginBottom: "2rem",
            lineHeight: "1.6",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            style={{ minWidth: "120px" }}
          >
            Go to Home
          </Button>
          {showLoginButton && (
            <Button
              variant="secondary"
              onClick={() => navigate("/login")}
              style={{ minWidth: "120px" }}
            >
              Log In
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
