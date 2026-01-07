import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmailCode, resendVerificationCode } from "../api/api";

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
      setSuccess("Email successfully verified! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired code.");
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
      setSuccess("New code sent!");
    } catch (err: any) {
      setError("Error sending code.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "1rem"
      }}>
        <div
          className="text-center"
          style={{
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h2
            className="mb-3"
            style={{ color: "var(--text)", fontWeight: 700 }}
          >
            Email not found
          </h2>
          <p className="text-muted">Return to sign up.</p>
        </div>
      </div>
        );
    };

  return (
    <div style={{ 
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div
        className="text-center"
        style={{
          maxWidth: "400px",
          width: "100%",
        }}
      >
          <h2
            className="mb-3"
            style={{ color: "var(--text)", fontWeight: 700 }}
          >
            Verify your email
          </h2>
          <p className="mb-4" style={{ color: "var(--muted)" }}>
            Enter the code you received via email to confirm your registration.
            <br />
            <span style={{ fontSize: "0.95em", color: "var(--primary)" }}>
              The code is valid for 30 minutes.
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
    </div>
  );
};

export default EmailVerification;
