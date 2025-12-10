import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmailCode, resendVerificationCode } from "../api/api";
import { Container } from "react-bootstrap";

interface EmailVerificationProps {
  email?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email: propEmail,
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Try to get email from props or location state
  const email = propEmail || (location.state && location.state.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await verifyEmailCode(email, code);
      setSuccess("Email verificata con successo! Ora puoi accedere.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Codice non valido o scaduto.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await resendVerificationCode(email);
      setResent(true);
      setSuccess("Nuovo codice inviato!");
    } catch (err: any) {
      setError("Errore nell’invio del codice.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="text-center"
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: "2.5rem",
            borderRadius: "24px",
            boxShadow: "0 8px 32px rgba(34,49,63,0.12)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h2
            className="mb-3"
            style={{ color: "var(--text)", fontWeight: 700 }}
          >
            Email non trovata
          </h2>
          <p style={{ color: "var(--muted)" }}>Torna alla registrazione.</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="email-verification-fullscreen">
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="text-center"
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: "2.5rem",
            borderRadius: "24px",
            boxShadow: "0 8px 32px rgba(34,49,63,0.12)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h2
            className="mb-3"
            style={{ color: "var(--text)", fontWeight: 700 }}
          >
            Verifica Email
          </h2>
          <p className="mb-4" style={{ color: "var(--muted)" }}>
            Inserisci il codice che hai ricevuto via email per confermare la
            registrazione.
            <br />
            <span style={{ fontSize: "0.95em", color: "var(--primary)" }}>
              Il codice è valido per 30 minuti.
            </span>
          </p>
          <form onSubmit={handleSubmit} className="mb-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification Code"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1px solid #ced4da",
                marginBottom: "1rem",
                fontSize: "1.1rem",
                textAlign: "center",
                background: "#f8f9fa",
                color: "#000",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                background: "var(--primary)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1.1rem",
                border: "none",
                boxShadow: "0 2px 8px rgba(34,49,63,0.08)",
                marginBottom: "0.5rem",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verifico..." : "Verifica"}
            </button>
          </form>
          <button
            onClick={handleResend}
            disabled={loading || resent}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "12px",
              background: resent ? "#e9ecef" : "var(--primary)",
              color: resent ? "var(--muted)" : "#fff",
              fontWeight: 500,
              fontSize: "1rem",
              border: "none",
              boxShadow: "0 2px 8px rgba(34,49,63,0.04)",
              marginBottom: "1rem",
              cursor: loading || resent ? "not-allowed" : "pointer",
            }}
          >
            {resent ? "Codice reinviato!" : "Reinvia codice"}
          </button>
          {error && (
            <div
              className="error-message mb-2"
              style={{ color: "#d9534f", fontWeight: 500 }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="success-message mb-2"
              style={{ color: "#28a745", fontWeight: 500 }}
            >
              {success}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default EmailVerification;
