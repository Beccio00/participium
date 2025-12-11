import { Modal, Badge, Carousel } from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { ReportStatus } from "../../../../shared/ReportTypes";
import type { Report } from "../../types/report.types";
import ReportChat from "./ReportChat";

interface Props {
  show: boolean;
  onHide: () => void;
  report: Report;
  onReportUpdate?: (report: Report) => void;
}

function statusVariant(status?: string) {
  switch (status) {
    case ReportStatus.PENDING_APPROVAL.toString():
      return "#f59e0b";
    case ReportStatus.ASSIGNED.toString():
      return "#3b82f6";
    case ReportStatus.EXTERNAL_ASSIGNED.toString():
      return "#8b5cf6";
    case ReportStatus.IN_PROGRESS.toString():
      return "#06b6d4";
    case ReportStatus.RESOLVED.toString():
      return "#10b981";
    case ReportStatus.REJECTED.toString():
      return "#ef4444";
    case ReportStatus.SUSPENDED.toString():
      return "#6b7280";
    default:
      return "#374151";
  }
}

export default function ReportDetailsModal({
  show,
  onHide,
  report,
  onReportUpdate,
}: Props) {
  // Ref per la chat container
  const chatRef = useRef<HTMLDivElement>(null);

  // Chat state (dichiarato subito dopo il ref)
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  // Stato per la visibilità della chat
  const [canSeeChat, setCanSeeChat] = useState(false);

  // Scroll automatico in fondo ogni volta che arrivano nuovi messaggi
  useEffect(() => {
    if (canSeeChat && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, canSeeChat]);

  // Per identificare l'utente corrente
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(
    null
  );
  useEffect(() => {
    let ignore = false;
    async function getUser() {
      try {
        const session = await import("../../api/api").then((api) =>
          api.getSession()
        );
        if (!ignore) {
          const user = session?.user as { id?: string | number };
          setCurrentUserId(
            user && "id" in user ? (user.id != null ? user.id : null) : null
          );
        }
      } catch {
        if (!ignore) setCurrentUserId(null);
      }
    }
    getUser();
    return () => {
      ignore = true;
    };
  }, []);

  // Aggiorna il report dal backend quando il modale viene aperto
  useEffect(() => {
    let mounted = true;
    async function fetchUpdatedReport() {
      try {
        const allReports = await import("../../api/api").then((api) =>
          api.getReports()
        );
        const updated = allReports.find((r) => r.id === report.id);
        if (updated && onReportUpdate && mounted) {
          onReportUpdate(updated);
        }
      } catch {}
    }
    if (show && report?.id) {
      fetchUpdatedReport();
    }
    return () => {
      mounted = false;
    };
  }, [show, report?.id]);

  // Fetch messages when modal opens or report changes, e polling ogni 5s senza flash
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;
    let prevLength = 0;
    async function fetchMessages(showLoading = false) {
      if (showLoading) setMessagesLoading(true);
      setMessagesError("");
      try {
        // @ts-ignore
        const msgs = await import("../../api/api").then((api) =>
          api.getReportMessages(report.id)
        );
        if (isMounted) {
          setMessages(msgs);
          // Scroll in fondo se ci sono nuovi messaggi
          if (chatRef?.current && msgs.length > prevLength) {
            setTimeout(() => {
              if (chatRef.current)
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }, 100);
          }
          prevLength = msgs.length;
        }
      } catch (err: any) {
        if (isMounted)
          setMessagesError(err?.message || "Errore nel caricamento messaggi");
      } finally {
        if (isMounted && showLoading) setMessagesLoading(false);
      }
    }
    if (show && report?.id) {
      fetchMessages(true);
      interval = setInterval(() => fetchMessages(false), 5000);
    }
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [show, report?.id]);

  // Aggiorna chat dopo invio messaggio
  async function handleSendMessage() {
    if (!messageText.trim()) return;
    setMessageLoading(true);
    setMessageError("");
    try {
      // @ts-ignore
      await import("../../api/api").then((api) =>
        api.sendReportMessage(display.id, messageText)
      );
      setMessageText("");
      // Ricarica messaggi
      setMessagesLoading(true);
      const msgs = await import("../../api/api").then((api) =>
        api.getReportMessages(display.id)
      );
      setMessages(msgs);
    } catch (err: any) {
      setMessageError(err?.message || "Errore invio messaggio");
    } finally {
      setMessageLoading(false);
      setMessagesLoading(false);
    }
  }
  const [detailedReport, setDetailedReport] = useState<any>(report as any);
  const display = detailedReport || report;
  const statusText =
    typeof display.status === "string"
      ? display.status
      : String(display.status);
  const isResolved =
    statusText &&
    String(statusText).toUpperCase() === ReportStatus.RESOLVED.toString();

  // For sending messages
  const [messageText, setMessageText] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    setDetailedReport(report as any);
    setMessageText("");
    setMessageError("");
  }, [report?.id]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await import("../../api/api").then((api) =>
          api.getSession()
        );
        const user = session?.user;
        // Cittadino autore
        if (
          display?.user &&
          "id" in display.user &&
          user &&
          "id" in user &&
          user.id === display.user.id &&
          user.role === "CITIZEN"
        ) {
          setCanSeeChat(true);
          return;
        }
        // External maintainer assegnato (usa externalHandler.user.id)
        const extId =
          display?.externalHandler?.user && "id" in display.externalHandler.user
            ? display.externalHandler.user.id
            : undefined;
        if (
          extId &&
          user &&
          "id" in user &&
          user.id === extId &&
          user.role === "EXTERNAL_MAINTAINER"
        ) {
          setCanSeeChat(true);
          return;
        }
        // Technical staff assegnato
        if (
          display?.assignedOfficer &&
          user &&
          "id" in user &&
          user.id === display.assignedOfficer.id &&
          user.role &&
          user.role.startsWith("MUNICIPAL")
        ) {
          setCanSeeChat(true);
          return;
        }
        // Non loggato o non autorizzato
        setCanSeeChat(false);
      } catch {
        setCanSeeChat(false);
      }
    }
    checkAuth();
  }, [
    display?.user?.id,
    display?.assignedExternalMaintainerId,
    display?.externalMaintainer?.id,
    display?.assignedOfficer?.id,
  ]);

  // Resolve assignee: prefer full objects (assignedOfficer, externalMaintainer, externalCompany)
  function resolveAssignee(r: any) {
    if (r.externalHandler) {
      const h = r.externalHandler;
      if (h.type === "user" && h.user) {
        const u = h.user;
        if (u.firstName || u.lastName)
          return `${u.firstName} ${u.lastName}`.trim();
        if (u.id != null) return `External Maintainer #${u.id}`;
      }
      if (h.type === "company" && h.company) {
        const c = h.company;
        if (c.name) return c.name;
        if (c.id != null) return `External Company #${c.id}`;
      }
    }
    if (
      r.assignedOfficer &&
      (r.assignedOfficer.firstName || r.assignedOfficer.lastName)
    ) {
      return `${r.assignedOfficer.firstName} ${r.assignedOfficer.lastName}`.trim();
    }
    return null;
  }

  const assigneeLabel = resolveAssignee(display as any);

  const uniquePhotos = Array.isArray(display.photos)
    ? [
        ...new Map(
          (display.photos as any[]).map((p: any) => [p.url, p])
        ).values(),
      ]
    : [];

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="report-modal"
      dialogClassName="report-modal-dialog"
    >
      <Modal.Header
        closeButton
        style={{
          background: "var(--primary)",
          color: "white",
          border: "none",
        }}
      >
        <Modal.Title
          style={{ fontSize: "1.3rem", fontWeight: 600, color: "white" }}
        >
          {report.title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "1.5rem" }}>
        {/* Fixed-size inner container with styled scrollbar */}
        <div
          className="report-modal-body reports-sidebar-scroll"
          style={{
            height: "calc(100vh - 200px)", // fits within viewport (header + footer ~200px)
            maxHeight: "calc(100vh - 160px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            paddingRight: 8,
          }}
        >
          {/* Image Section */}
          <div style={{ width: "100%" }}>
            {Array.isArray(display.photos) && display.photos.length > 0 ? (
              <div
                style={{
                  width: "100%",
                  height: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Carousel
                  interval={null}
                  touch
                  wrap
                  controls={uniquePhotos.length > 1}
                >
                  {uniquePhotos.map((photo: any, idx: number) => (
                    <Carousel.Item key={photo.url ?? idx}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 420,
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={`${display.title} - Photo ${idx + 1}`}
                          loading="lazy"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            borderRadius: "0.5rem",
                            background: "var(--bg)",
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 250,
                  background: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: "1rem",
                  borderRadius: "0.5rem",
                  border: "2px dashed var(--muted)",
                }}
              >
                <span>
                  <i
                    className="bi bi-camera"
                    style={{ marginRight: "0.5rem" }}
                    aria-hidden
                  ></i>
                  No images available
                </span>
              </div>
            )}
          </div>

          {/* Chat Section: mostra solo se autorizzato, in fondo al body */}

          {/* Status and Category */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Badge
              bg=""
              style={{
                backgroundColor: statusVariant(statusText),
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem",
                padding: "0.4rem 0.8rem",
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {statusText}
            </Badge>
            <span
              style={{
                background: "var(--stone)",
                color: "white",
                padding: "0.4rem 0.8rem",
                borderRadius: "0.25rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-block",
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {display.category}
            </span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h6
              style={{
                color: "var(--text)",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Description
            </h6>
            <p
              style={{
                color: "var(--text)",
                fontSize: "1rem",
                lineHeight: 1.5,
                margin: 0,
                background: "var(--bg)",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--muted)",
              }}
            >
              {display.description}
            </p>
          </div>

          {/* Metadata */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div>
              <strong style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                <i
                  className="bi bi-person-fill"
                  style={{ marginRight: "0.35rem" }}
                  aria-hidden
                ></i>
                Created by:
              </strong>
              <span style={{ marginLeft: "0.5rem", color: "var(--text)" }}>
                {display.user
                  ? `${display.user.firstName} ${display.user.lastName}`
                  : display.isAnonymous
                  ? "Anonymous user"
                  : "Unknown"}
              </span>
            </div>

            <div>
              <strong style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                <i
                  className="bi bi-person-badge"
                  style={{ marginRight: "0.35rem" }}
                  aria-hidden
                ></i>
                {isResolved ? "Resolved by:" : "Assigned to:"}
              </strong>
              <span style={{ marginLeft: "0.5rem", color: "var(--text)" }}>
                {assigneeLabel ?? "Not assigned"}
              </span>
            </div>

            <div>
              <strong style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                <i
                  className="bi bi-calendar3"
                  style={{ marginRight: "0.35rem" }}
                  aria-hidden
                ></i>
                Created at:
              </strong>
              <span style={{ marginLeft: "0.5rem", color: "var(--text)" }}>
                {display.createdAt
                  ? new Date(display.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not available"}
              </span>
            </div>

            <div>
              <strong style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                <i
                  className="bi bi-geo-alt"
                  style={{ marginRight: "0.35rem" }}
                  aria-hidden
                ></i>
                Address:
              </strong>
              <span
                style={{
                  marginLeft: "0.5rem",
                  color: "var(--text)",
                  wordBreak: "break-word",
                }}
              >
                {display.address}
              </span>
            </div>
          </div>

          <ReportChat
            canSeeChat={canSeeChat}
            messages={messages}
            messagesLoading={messagesLoading}
            messagesError={messagesError}
            currentUserId={currentUserId}
            display={display}
            messageText={messageText}
            setMessageText={setMessageText}
            messageLoading={messageLoading}
            messageError={messageError}
            onSend={handleSendMessage}
          />
          
        </div>
      </Modal.Body>
    </Modal>
  );
}
