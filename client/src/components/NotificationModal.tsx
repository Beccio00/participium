import { Modal, Button, Badge } from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import "./NotificationModal.css";

interface Notification {
  id: number;
  reportId: number;
  message: string;
  createdAt: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
  onOpenReport: (reportId: number) => void;
  notifications: Notification[];
}

export default function NotificationModal({
  show,
  onHide,
  onOpenReport,
  notifications,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="notification-modal-header">
        <Modal.Title style={{ color: "var(--primary)" }}>
          <BellFill style={{ marginRight: 8, color: "var(--primary)" }} /> Notifications
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {notifications.length === 0 ? (
          <div style={{ color: "#888" }}>No notifications yet.</div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  boxShadow: "0 1px 4px #e0e7ef",
                  cursor: "pointer",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => onOpenReport(n.reportId)}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#00796b" }}>
                    Your report has been updated!
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {new Date(n.createdAt).toLocaleString("it-IT")}
                  </div>
                </div>
                <Badge bg="info">View</Badge>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
