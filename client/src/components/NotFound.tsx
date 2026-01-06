import { useNavigate } from "react-router";
import { Container } from "react-bootstrap";
import { ExclamationTriangle } from "react-bootstrap-icons";
import Button from "./ui/Button";

export default function NotFound() {
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
            color: "#cd5c5c",
            marginBottom: "1.5rem",
          }}
        >
          <ExclamationTriangle size={64} />
        </div>
        <h2
          style={{
            color: "var(--text)",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            color: "#6c757d",
            fontSize: "1.1rem",
            marginBottom: "2rem",
            lineHeight: "1.6",
          }}
        >
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            style={{ minWidth: "120px" }}
          >
            Go to Home
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            style={{ minWidth: "120px" }}
          >
            Go Back
          </Button>
        </div>
      </div>
    </Container>
  );
}
