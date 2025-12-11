import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Navbar, Container, Nav, Button, Badge, Image } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { MUNICIPALITY_AND_EXTERNAL_ROLES, getRoleLabel, TECHNICIAN_ROLES } from "../utils/roles";
import {
  PersonCircle,
  ArrowLeft,
  GearFill,
  BellFill,
} from "react-bootstrap-icons";
import { getNotifications } from "../api/api";
import NotificationModal from "./NotificationModal";
import ReportDetailsModal from "../features/reports/ReportDetailsModal";
import { getReports } from "../api/api";

interface HeaderProps {
  showBackToHome?: boolean;
}

export default function Header({ showBackToHome = false }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Carica e salva le notifiche lette in localStorage
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>(
    () => {
      const saved = localStorage.getItem("readNotificationIds");
      return saved ? JSON.parse(saved) : [];
    }
  );

  // Salva le notifiche lette in localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem(
      "readNotificationIds",
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  // Polling per le notifiche
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    async function pollNotifications() {
      const canSeeNotifications =
        isAuthenticated && user &&
        (user.role === "CITIZEN" ||
          TECHNICIAN_ROLES.includes(user.role) ||
          user.role === "EXTERNAL_MAINTAINER");

      if (canSeeNotifications) {
        try {
          const notifs = await getNotifications();
          // Filtra le notifiche già lette
          const unread = notifs.filter(
            (n) => !readNotificationIds.includes(n.id)
          );
          setNotifications(unread);
          setNotificationCount(unread.length);
        } catch {
          setNotifications([]);
          setNotificationCount(0);
        }
      } else {
        setNotifications([]);
        setNotificationCount(0);
      }
    }
    pollNotifications();
    interval = setInterval(pollNotifications, 10000); // ogni 10s
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user, readNotificationIds]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => {
    // Carica i report solo se il cittadino è loggato
    if (isAuthenticated && user?.role === "CITIZEN") {
      getReports()
        .then(setReports)
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  // Funzione per aprire il modale report dalla notifica
  const handleOpenReportFromNotification = async (reportId: number) => {
    setShowNotifications(false);
    // Trova la notifica corrispondente
    const notif = notifications.find((n) => n.reportId === reportId);
    if (notif) {
      setReadNotificationIds((prev) => [...prev, notif.id]);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }

    // Triggera il refresh dei report nella HomePage
    window.dispatchEvent(new Event("refreshReports"));

    try {
      // Recupera il report aggiornato dal backend
      const allReports = await getReports();
      const updatedReport = allReports.find((r) => r.id === reportId);
      if (updatedReport) {
        setSelectedReport(updatedReport);
        setShowDetailsModal(true);
      }
    } catch {
      // fallback: usa lo stato locale se la fetch fallisce
      const report = reports.find((r) => r.id === reportId);
      if (report) {
        setSelectedReport(report);
        setShowDetailsModal(true);
      }
    }
  };
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => navigate("/login");
  const handleGoToSignup = () => navigate("/signup");
  const handleBackHome = () => {
    if (user?.role === "ADMINISTRATOR" || user?.role === "TECHNICAL_OFFICE") {
      handleLogout();
    } else {
      navigate("/");
    }
  };

  const navbarStyle = {
    background:
      "linear-gradient(135deg, color-mix(in srgb, var(--navbar-accent) 85%, var(--primary) 15%) 0%, color-mix(in srgb, var(--navbar-accent) 60%, var(--stone) 40%) 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)",
    boxShadow: "0 6px 30px rgba(0, 0, 0, 0.12)",
    backdropFilter: "saturate(120%) blur(2px)",
    minHeight: "60px",
    paddingTop: "0.5rem",
    paddingBottom: "0.5rem",
  };

  const buttonStyle = {
    padding: "0.375rem 1rem",
    fontSize: "0.875rem",
    whiteSpace: "nowrap" as const,
  };

  const userAvatarStyle = {
    fontSize: "2rem",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    borderRadius: "50%",
    color: "rgba(255, 255, 255, 0.95)",
  };

  function normalizeMinioUrl(url?: string | null) {
    if (!url) return null;
    try {
      if (url.includes("://minio"))
        return url.replace("://minio", "://localhost");
      if (url.includes("minio:")) return url.replace("minio:", "localhost:");
    } catch (e) {
      // ignore
    }
    return url;
  }

  const userNameStyle = {
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "white",
    margin: 0,
  };

  const userSurnameStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
  };

  return (
    <>
      <Navbar
        sticky="top"
        expand="lg"
        expanded={expanded}
        onToggle={setExpanded}
        style={navbarStyle}
      >
        <Container
          fluid
          className="px-3 px-md-4"
          style={{ maxWidth: "1200px" }}
        >
          <div
            className="d-flex align-items-center justify-content-between w-100"
            style={{ minHeight: "60px" }}
          >
            <Navbar.Brand className="text-white mb-0">
              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <h1
                  className="mb-0"
                  style={{
                    fontSize: "clamp(1.3rem, 5vw, 1.8rem)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  Participium
                </h1>
                <span
                  style={{
                    fontSize: "clamp(0.7rem, 2.5vw, 0.9rem)",
                    opacity: 0.9,
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  Digital Citizen Participation
                </span>
              </div>
            </Navbar.Brand>

            {/* User info visible always on desktop and mobile, outside the burger */}
            {isAuthenticated && user && !showBackToHome && (
              <div className="d-flex align-items-center gap-2 d-lg-none">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      ...userAvatarStyle,
                      fontSize: "1.5rem",
                      width: "32px",
                      height: "32px",
                    }}
                  >
                    {(() => {
                      const photoRaw = ((user as any)?.photoUrl ||
                        (user as any)?.photo) as string | null | undefined;
                      const photo = normalizeMinioUrl(photoRaw) ?? undefined;
                      return photo ? (
                        <Image
                          src={photo}
                          roundedCircle
                          width={32}
                          height={32}
                          alt="avatar"
                        />
                      ) : (
                        <PersonCircle />
                      );
                    })()}
                  </div>
                  <div className="d-flex flex-column">
                    <div style={{ ...userNameStyle, fontSize: "0.85rem" }}>
                      {user.firstName}
                    </div>
                    <div style={{ ...userSurnameStyle, fontSize: "0.75rem" }}>
                      {user.lastName}
                    </div>
                  </div>
                </div>
                {user.role === "CITIZEN" && (
                  <button
                    onClick={() => navigate("/me")}
                    className="border-0 bg-transparent d-flex align-items-center justify-content-center"
                    style={{
                      color: "white",
                      fontSize: "1.25rem",
                      padding: "0.25rem",
                      cursor: "pointer",
                    }}
                    aria-label="Account settings"
                  >
                    <GearFill />
                  </button>
                )}
                {/* Campanella notifiche mobile */}
                {(user && (user.role === "CITIZEN" || TECHNICIAN_ROLES.includes(user.role) || user.role === "EXTERNAL_MAINTAINER")) && (
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="border-0 bg-transparent d-flex align-items-center justify-content-center position-relative"
                    style={{
                      color: "white",
                      fontSize: "1.25rem",
                      padding: "0.25rem",
                      cursor: "pointer",
                    }}
                    aria-label="Show notifications"
                  >
                    <BellFill />
                    {notificationCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "#ef4444",
                          color: "white",
                          borderRadius: "50%",
                          fontSize: "0.75rem",
                          minWidth: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 5px",
                          fontWeight: 700,
                          zIndex: 2,
                          border: "2px solid white",
                        }}
                      >
                        {notificationCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {showBackToHome && location.pathname !== "/admin" ? (
              <button
                onClick={handleBackHome}
                disabled={loading}
                className="d-lg-none border-0 bg-transparent d-flex align-items-center justify-content-center"
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  padding: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <ArrowLeft size={24} />
              </button>
            ) : (
              <Navbar.Toggle
                aria-controls="navbar-nav"
                className="d-lg-none border-0 d-flex align-items-center justify-content-center"
                style={{ color: "white", padding: "0.5rem" }}
              >
                <span
                  style={{ color: "white", fontSize: "1.5rem", lineHeight: 1 }}
                >
                  ☰
                </span>
              </Navbar.Toggle>
            )}
          </div>

          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto align-items-lg-center mt-3 mt-lg-0">
              {showBackToHome && user?.role === "ADMINISTRATOR" ? (
                <>
                  {/* Logout button for admin both mobile and desktop */}
                  <Button
                    onClick={handleLogout}
                    disabled={loading}
                    variant="light"
                    size="sm"
                    className="fw-semibold"
                    style={{ ...buttonStyle, color: "var(--primary)" }}
                  >
                    {loading ? "Logging out..." : "Logout"}
                  </Button>
                </>
              ) : showBackToHome ? (
                <Button
                  onClick={handleBackHome}
                  disabled={loading}
                  variant="light"
                  size="sm"
                  className="fw-semibold d-none d-lg-block"
                  style={{ ...buttonStyle, color: "var(--primary)" }}
                >
                  {user?.role == "ADMINISTRATOR" ||
                  user?.role == "TECHNICAL_OFFICE"
                    ? "Logout"
                    : "← Back to Home"}
                </Button>
              ) : isAuthenticated && user ? (
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                  {/* User info only on desktop in the collapse */}
                  <div className="d-none d-lg-flex flex-lg-row align-items-lg-center gap-3">
                    {MUNICIPALITY_AND_EXTERNAL_ROLES.includes(user.role) && (
                      <Badge
                        bg="dark"
                        className="bg-opacity-25"
                        style={{ fontSize: "0.9rem", padding: "4px 8px" }}
                      >
                        {getRoleLabel(user.role as string)}
                      </Badge>
                    )}
                    <div className="d-flex align-items-center gap-2">
                      <div style={userAvatarStyle}>
                        {(() => {
                          const photoRaw = ((user as any)?.photoUrl ||
                            (user as any)?.photo) as string | null | undefined;
                          const photo =
                            normalizeMinioUrl(photoRaw) ?? undefined;
                          return photo ? (
                            <Image
                              src={photo}
                              roundedCircle
                              width={40}
                              height={40}
                              alt="avatar"
                            />
                          ) : (
                            <PersonCircle />
                          );
                        })()}
                      </div>
                      <div className="d-flex flex-column">
                        <div style={userNameStyle}>{user.firstName}</div>
                        <div style={userSurnameStyle}>{user.lastName}</div>
                      </div>
                    </div>
                    {user.role === "CITIZEN" && (
                      <button
                        onClick={() => navigate("/me")}
                        className="border-0 bg-transparent d-flex align-items-center justify-content-center"
                        style={{
                          color: "white",
                          fontSize: "1.25rem",
                          padding: "0.25rem",
                          marginLeft: "0.5rem",
                          cursor: "pointer",
                        }}
                        aria-label="Account settings"
                      >
                        <GearFill />
                      </button>
                    )}
                    {/* Campanella notifiche desktop */}
                    {(user && (user.role === "CITIZEN" || TECHNICIAN_ROLES.includes(user.role) || user.role === "EXTERNAL_MAINTAINER")) && (
                      <button
                        onClick={() => setShowNotifications(true)}
                        className="border-0 bg-transparent d-flex align-items-center justify-content-center position-relative"
                        style={{
                          color: "white",
                          fontSize: "1.25rem",
                          padding: "0.25rem",
                          marginLeft: "0.5rem",
                          cursor: "pointer",
                        }}
                        aria-label="Show notifications"
                      >
                        <BellFill />
                        {notificationCount > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              background: "#ef4444",
                              color: "white",
                              borderRadius: "50%",
                              fontSize: "0.75rem",
                              minWidth: "18px",
                              height: "18px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 5px",
                              fontWeight: 700,
                              zIndex: 2,
                              border: "2px solid white",
                            }}
                          >
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  {/* Logout button */}
                  <Button
                    onClick={handleLogout}
                    disabled={loading}
                    variant="light"
                    size="sm"
                    className="fw-semibold ms-lg-3"
                    style={{ ...buttonStyle, color: "var(--primary)" }}
                  >
                    {loading ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <Button
                    onClick={handleGoToLogin}
                    variant="light"
                    size="sm"
                    className="fw-semibold"
                    style={{ ...buttonStyle, color: "var(--primary)" }}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleGoToSignup}
                    variant="light"
                    size="sm"
                    className="fw-semibold"
                    style={{ ...buttonStyle, color: "var(--primary)" }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <NotificationModal
        show={showNotifications}
        onHide={() => setShowNotifications(false)}
        onOpenReport={handleOpenReportFromNotification}
        notifications={notifications}
      />
      {selectedReport && (
        <ReportDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          report={selectedReport}
        />
      )}
    </>
  );
}
