import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { Navbar, Container, Nav, Button, Badge, Image } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { 
  MUNICIPALITY_AND_EXTERNAL_ROLES, 
  getRoleLabel, 
  TECHNICIAN_ROLES,
  userHasRole,
  userHasAnyRole,
} from "../utils/roles";
import {
  PersonCircle,
  GearFill,
  BellFill,
  Telegram,
} from "react-bootstrap-icons";
import { getNotifications } from "../api/api";
import NotificationModal from "./NotificationModal";
import TelegramModal from "./TelegramModal";
import ReportDetailsModal from "../features/reports/ReportDetailsModal";
import { getReports } from "../api/api";

interface HeaderProps {
  showBackToHome?: boolean;
}

// Helper: Check if user can see notifications
function canUserSeeNotifications(user: any, isAuthenticated: boolean): boolean {
  if (!isAuthenticated || !user) return false;
  return (
    userHasRole(user, "CITIZEN") ||
    userHasAnyRole(user, TECHNICIAN_ROLES) ||
    userHasRole(user, "EXTERNAL_MAINTAINER")
  );
}

// Helper: Normalize Minio URLs
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

// Helper: Get user photo
function getUserPhoto(user: any): string | undefined {
  const photoRaw = (user?.photoUrl || user?.photo) as string | null | undefined;
  return normalizeMinioUrl(photoRaw) ?? undefined;
}

// Shared styles for header buttons
const headerIconButtonStyle = {
  color: "white",
  fontSize: "1.25rem",
  padding: "0.25rem",
  cursor: "pointer",
};

// Component: Header Icon Button (reusable)
function HeaderIconButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="border-0 bg-transparent d-flex align-items-center justify-content-center"
      style={headerIconButtonStyle}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

// Component: User Avatar
function UserAvatar({ user, size = 40 }: { user: any; size?: number }) {
  const photo = getUserPhoto(user);
  const avatarStyle = {
    fontSize: `${size / 20}rem`,
    width: `${size}px`,
    height: `${size}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    borderRadius: "50%",
    color: "rgba(255, 255, 255, 0.95)",
  };

  return (
    <div style={avatarStyle}>
      {photo ? (
        <Image
          src={photo}
          roundedCircle
          width={size}
          height={size}
          alt="avatar"
        />
      ) : (
        <PersonCircle />
      )}
    </div>
  );
}

// Component: Notification Button
function NotificationButton({
  onClick,
  notificationCount,
}: {
  onClick: () => void;
  notificationCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="border-0 bg-transparent d-flex align-items-center justify-content-center position-relative"
      style={headerIconButtonStyle}
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
  );
}

// Component: User Action Icons (Settings, Telegram, Notifications)
function UserActionIcons({
  user,
  isAuthenticated,
  notificationCount,
  onSettingsClick,
  onTelegramClick,
  onNotificationsClick,
}: {
  user: any;
  isAuthenticated: boolean;
  notificationCount: number;
  onSettingsClick: () => void;
  onTelegramClick: () => void;
  onNotificationsClick: () => void;
}) {
  return (
    <>
      {userHasRole(user, "CITIZEN") && (
        <HeaderIconButton
          onClick={onSettingsClick}
          icon={<GearFill />}
          label="Account settings"
        />
      )}
      {userHasRole(user, "CITIZEN") && (
        <HeaderIconButton
          onClick={onTelegramClick}
          icon={<Telegram />}
          label="Telegram settings"
        />
      )}
      {canUserSeeNotifications(user, isAuthenticated) && (
        <NotificationButton
          onClick={onNotificationsClick}
          notificationCount={notificationCount}
        />
      )}
    </>
  );
}

export default function Header({ showBackToHome = false }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load and save read notifications in localStorage
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>(
    () => {
      const saved = localStorage.getItem("readNotificationIds");
      return saved ? JSON.parse(saved) : [];
    }
  );

  // Use ref to avoid re-creating interval when readNotificationIds changes
  const readNotificationIdsRef = useRef(readNotificationIds);
  useEffect(() => {
    readNotificationIdsRef.current = readNotificationIds;
  }, [readNotificationIds]);

  // Save read notifications in localStorage when they change
  useEffect(() => {
    localStorage.setItem(
      "readNotificationIds",
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  // Polling function as a callback to avoid recreating on each render
  const pollNotifications = useCallback(async () => {
    if (!canUserSeeNotifications(user, isAuthenticated)) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      const notifs = await getNotifications();
      
      // Clean up orphan IDs from localStorage (IDs that no longer exist in server)
      const serverIds = notifs.map((n) => n.id);
      const currentReadIds = readNotificationIdsRef.current;
      const validReadIds = currentReadIds.filter((id) => serverIds.includes(id));
      if (validReadIds.length !== currentReadIds.length) {
        setReadNotificationIds(validReadIds);
      }
      
      // Filter out already read notifications
      const unread = notifs.filter(
        (n) => !validReadIds.includes(n.id)
      );
      setNotifications(unread);
      setNotificationCount(unread.length);
    } catch {
      setNotifications([]);
      setNotificationCount(0);
    }
  }, [isAuthenticated, user]);

  // Polling for notifications - only depends on pollNotifications callback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    pollNotifications();
    interval = setInterval(pollNotifications, 10000); // ogni 10s
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pollNotifications]);

  // Re-filter notifications when readNotificationIds changes (without refetching)
  useEffect(() => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => !readNotificationIds.includes(n.id));
      setNotificationCount(filtered.length);
      return filtered;
    });
  }, [readNotificationIds]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Carica i report solo se il cittadino è loggato
    if (isAuthenticated && userHasRole(user, "CITIZEN")) {
      getReports()
        .then(setReports)
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  // Function to open the report modal from the notification
  const handleOpenReportFromNotification = async (reportId: number) => {
    setShowNotifications(false);
    markNotificationAsRead(reportId);
    window.dispatchEvent(new Event("refreshReports"));
    await openReportModal(reportId);
  };

  // Helper: Mark notification as read
  const markNotificationAsRead = (reportId: number) => {
    const notif = notifications.find((n) => n.reportId === reportId);
    if (!notif) return;

    setReadNotificationIds((prev) => [...prev, notif.id]);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };

  // Helper: Open report modal
  const openReportModal = async (reportId: number) => {
    try {
      const allReports = await getReports();
      const updatedReport = allReports.find((r) => r.id === reportId);
      if (updatedReport) {
        setSelectedReport(updatedReport);
        setShowDetailsModal(true);
        return;
      }
    } catch {
      // fallback: usa lo stato locale se la fetch fallisce
    }

    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setShowDetailsModal(true);
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
  const handleBackHome = () => navigate("/");

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
          className="px-2 px-sm-3 px-md-4"
          style={{ maxWidth: "1200px" }}
        >
          <div
            className="d-flex align-items-center justify-content-between w-100 flex-wrap"
            style={{ minHeight: "60px", rowGap: "0.5rem" }}
          >
            <Navbar.Brand className="text-white mb-0" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
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
              <div className="d-flex align-items-center gap-1 gap-md-2 d-lg-none">
                <div className="d-flex align-items-center gap-2">
                  <UserAvatar user={user} size={32} />
                  <div className="d-flex flex-column">
                    <div style={{ ...userNameStyle, fontSize: "0.85rem" }}>
                      {user.firstName}
                    </div>
                    <div style={{ ...userSurnameStyle, fontSize: "0.75rem" }}>
                      {user.lastName}
                    </div>
                  </div>
                </div>
                <UserActionIcons
                  user={user}
                  isAuthenticated={isAuthenticated}
                  notificationCount={notificationCount}
                  onSettingsClick={() => navigate("/me")}
                  onTelegramClick={() => setShowTelegramModal(true)}
                  onNotificationsClick={() => setShowNotifications(true)}
                />
              </div>
            )}

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
          </div>

          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto align-items-lg-center mt-2 mt-lg-0">
              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 gap-lg-4">
                {/* Blocco 1: User info - always visible when logged in */}
                {isAuthenticated && user && (
                  <div className="d-none d-lg-flex flex-lg-row align-items-lg-center gap-2">
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
                      <UserAvatar user={user} size={40} />
                      <div className="d-flex flex-column">
                        <div style={userNameStyle}>{user.firstName}</div>
                        <div style={userSurnameStyle}>{user.lastName}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocco 2: Action icons */}
                {isAuthenticated && user && (
                  <div className="d-none d-lg-flex flex-lg-row align-items-lg-center gap-2">
                    <UserActionIcons
                      user={user}
                      isAuthenticated={isAuthenticated}
                      notificationCount={notificationCount}
                      onSettingsClick={() => navigate("/me")}
                      onTelegramClick={() => setShowTelegramModal(true)}
                      onNotificationsClick={() => setShowNotifications(true)}
                    />
                  </div>
                )}

                {/* Blocco 3: Buttons on the right */}
                {isAuthenticated && user ? (
                  <div className="d-flex gap-2 w-100 d-lg-auto">
                    {showBackToHome && (
                      <Button
                        onClick={handleBackHome}
                        disabled={loading}
                        variant="light"
                        size="sm"
                        className="fw-semibold"
                        style={{ ...buttonStyle, color: "var(--primary)" }}
                      >
                        Home
                      </Button>
                    )}
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
                  </div>
                ) : (
                  <div className="d-flex gap-2 w-100 d-lg-auto">
                    {showBackToHome && (
                      <Button
                        onClick={handleBackHome}
                        disabled={loading}
                        variant="light"
                        size="sm"
                        className="fw-semibold"
                        style={{ ...buttonStyle, color: "var(--primary)" }}
                      >
                        Home
                      </Button>
                    )}
                    {location.pathname !== "/login" && location.pathname !== "/verify-email" && (
                      <Button
                        onClick={handleGoToLogin}
                        variant="light"
                        size="sm"
                        className="fw-semibold"
                        style={{ ...buttonStyle, color: "var(--primary)" }}
                      >
                        Login
                      </Button>
                    )}
                    {location.pathname !== "/signup" && location.pathname !== "/verify-email" && (
                      <Button
                        onClick={handleGoToSignup}
                        variant="light"
                        size="sm"
                        className="fw-semibold"
                        style={{ ...buttonStyle, color: "var(--primary)" }}
                      >
                        Sign Up
                      </Button>
                    )}
                  </div>
                )}
              </div>
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
      <TelegramModal
        show={showTelegramModal}
        onHide={() => setShowTelegramModal(false)}
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
