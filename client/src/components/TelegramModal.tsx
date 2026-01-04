import { useState, useEffect } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { Telegram, Link45deg, CheckCircleFill, XCircleFill, ExclamationTriangleFill } from "react-bootstrap-icons";
import {
  getTelegramStatus,
  generateTelegramToken,
  unlinkTelegram,
} from "../api/telegram";
import type { TelegramStatusResponse } from "../api/telegram";

interface Props {
  show: boolean;
  onHide: () => void;
}

export default function TelegramModal({ show, onHide }: Props) {
  const [status, setStatus] = useState<TelegramStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    if (show) {
      fetchStatus();
    } else {
      setDeepLink(null);
      setLinkGenerated(false);
      setError(null);
    }
  }, [show]);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTelegramStatus();
      setStatus(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch Telegram status");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const result = await generateTelegramToken();
      setDeepLink(result.deepLink);
      setLinkGenerated(true);
    } catch (err: any) {
      if (err.status === 409) {
        await fetchStatus();
      } else {
        setError(err.message || "Failed to generate link");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenTelegram = () => {
    if (deepLink) {
      window.open(deepLink, "_blank");
      onHide();
    }
  };

  const handleUnlinkClick = () => {
    setShowUnlinkConfirm(true);
  };

  const handleUnlinkConfirm = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await unlinkTelegram();
      setStatus({ linked: false, telegramUsername: null, telegramId: null });
      setShowUnlinkConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to unlink Telegram");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkCancel = () => {
    setShowUnlinkConfirm(false);
  };

  const handleClose = () => {
    onHide();
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mb-0">
          {error}
        </Alert>
      );
    }

    // Show unlink confirmation view
    if (showUnlinkConfirm) {
      return (
        <div className="text-center py-3">
          <ExclamationTriangleFill size={48} className="mb-3" style={{ color: "var(--primary)" }} />
          <h5 style={{ color: "var(--text)" }}>Unlink Telegram</h5>
          <p className="text-muted">
            Are you sure you want to unlink your Telegram account? You will no longer receive notifications on Telegram.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button
              variant="outline-secondary"
              onClick={handleUnlinkCancel}
              disabled={actionLoading}
              style={{
                borderRadius: "8px",
                padding: "8px 20px",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUnlinkConfirm}
              disabled={actionLoading}
              style={{
                borderRadius: "8px",
                padding: "8px 20px",
              }}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Unlinking...
                </>
              ) : (
                "Unlink"
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Account is linked
    if (status?.linked) {
      return (
        <div className="text-center">
          <CheckCircleFill size={48} className="text-success mb-3" />
          <h5 className="text-success">Telegram Connected!</h5>
          <p className="text-muted mb-2">
            Your account is linked to:
          </p>
          <p className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.1rem" }}>
            @{status.telegramUsername || "Unknown"}
          </p>
          <p className="text-muted small">
            You will receive notifications about your reports directly on Telegram.
          </p>
          <hr />
          <Button
            variant="outline-danger"
            onClick={handleUnlinkClick}
            disabled={actionLoading}
            size="sm"
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Unlinking...
              </>
            ) : (
              <>
                <XCircleFill className="me-2" />
                Unlink Telegram
              </>
            )}
          </Button>
        </div>
      );
    }

    // Link generated, show button to open Telegram
    if (linkGenerated && deepLink) {
      return (
        <div className="text-center">
          <Link45deg size={48} className="mb-3" style={{ color: "var(--primary)" }} />
          <h5 style={{ color: "var(--primary)" }}>Link Generated!</h5>
          <p className="text-muted">
            Click the button below to open Telegram and complete the linking process.
          </p>
          <Button
            variant="primary"
            onClick={handleOpenTelegram}
            className="d-flex align-items-center justify-content-center gap-2 mx-auto"
            style={{ background: "#0088cc", borderColor: "#0088cc" }}
          >
            <Telegram size={20} />
            Open Telegram
          </Button>
          <p className="text-muted small mt-3">
            After clicking, the bot will automatically link your account.
            <br />
            You can close this window once done.
          </p>
          <hr />
          <Button
            variant="link"
            onClick={() => {
              setLinkGenerated(false);
              setDeepLink(null);
            }}
            className="text-muted"
          >
            Generate new link
          </Button>
        </div>
      );
    }

    // Not linked, show explanation
    return (
      <div className="text-center">
        <Telegram size={48} className="mb-3" style={{ color: "#0088cc" }} />
        <h5 style={{ color: "var(--primary)" }}>Connect Telegram</h5>
        <p className="text-muted">
          Link your Telegram account to receive instant notifications about your reports directly on your phone.
        </p>
        <div className="bg-light rounded p-3 mb-3 text-start">
          <p className="mb-2 fw-semibold">Benefits:</p>
          <ul className="mb-0 ps-3">
            <li>Instant notifications when your report status changes</li>
            <li>Updates when officers reply to your reports</li>
            <li>No need to check the website constantly</li>
          </ul>
        </div>
        <Button
          variant="primary"
          onClick={handleGenerateLink}
          disabled={actionLoading}
          className="d-flex align-items-center justify-content-center gap-2 mx-auto"
          style={{ background: "#0088cc", borderColor: "#0088cc" }}
        >
          {actionLoading ? (
            <>
              <Spinner animation="border" size="sm" />
              Generating...
            </>
          ) : (
            <>
              <Telegram size={20} />
              Connect Telegram
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ color: "var(--primary)" }}>
          <Telegram style={{ marginRight: 8, color: "var(--navbar-accent)" }} />
          Telegram Notifications
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        {renderContent()}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
