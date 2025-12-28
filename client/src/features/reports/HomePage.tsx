import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Clipboard, Pencil, List } from "react-bootstrap-icons";
import { Offcanvas } from "react-bootstrap";

import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import AuthRequiredModal from "../auth/AuthRequiredModal.tsx";
import ReportCard from "./ReportCard.tsx";
import MapView from "../../components/MapView";
import ReportDetailsModal from "./ReportDetailsModal";

import type { Report } from "../../types";
import { getReports as getReportsApi } from "../../api/api";

import { Role } from "../../../../shared/RoleTypes.ts";
import { ReportStatus } from "../../../../shared/ReportTypes.ts";

import "../../styles/HomePage.css";

// --- Helpers ---------------------------------------------------------------

function getRecentReports(reports: Report[]): Report[] {
  return [...reports]
    .sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10);
}

function isUserOwnReport(report: Report, isAuthenticated: boolean, user: any): boolean {
  return Boolean(isAuthenticated && user && report.user && user.email === report.user.email);
}

function saveSidebarScroll(sidebarScrollRef: React.MutableRefObject<number>) {
  const sidebar = document.querySelector(".reports-sidebar-scroll") as HTMLElement | null;
  if (sidebar) sidebarScrollRef.current = sidebar.scrollTop;
}

// Normalizza lat/long numerici (API può restituire stringhe)
function normalizeReports(data: any[]): Report[] {
  return (data || []).map((r: any) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

// --------------------------------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportsSidebar, setShowReportsSidebar] = useState(false);

  const sidebarScrollRef = useRef<number>(0);

  const [reports, setReports] = useState<Report[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // --- Roles (user.role è string[]) ---------------------------------------

  const roles: string[] = useMemo(() => {
    return Array.isArray(user?.role) ? user.role : [];
  }, [user?.role]);

  const hasRole = (role: Role | string) => roles.includes(String(role));

  const isAdmin = useMemo(() => isAuthenticated && hasRole(Role.ADMINISTRATOR), [isAuthenticated, roles]);
  const isCitizen = useMemo(() => isAuthenticated && hasRole(Role.CITIZEN), [isAuthenticated, roles]);
  const isPublicRelations = useMemo(
    () => isAuthenticated && hasRole(Role.PUBLIC_RELATIONS),
    [isAuthenticated, roles]
  );

  const isTechnicalOfficer = useMemo(() => {
    if (!isAuthenticated) return false;
    // "Tecnico" = qualsiasi ruolo che NON sia citizen/admin/public_relations
    const blocked = [String(Role.CITIZEN), String(Role.ADMINISTRATOR), String(Role.PUBLIC_RELATIONS)];
    return roles.length > 0 && !roles.some((r) => blocked.includes(r));
  }, [isAuthenticated, roles]);

  // --- Report handlers -----------------------------------------------------

  const handleReportUpdate = (updatedReport: Report) => {
    setReports((prev) => prev.map((r) => (r.id === updatedReport.id ? updatedReport : r)));
  };

  const refreshReports = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const handleRefresh = () => refreshReports();
    window.addEventListener("refreshReports", handleRefresh);
    return () => window.removeEventListener("refreshReports", handleRefresh);
  }, []);

  const handleReportDetailsClick = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);

    // su mobile: chiudo la lista (offcanvas) e lascio la mappa visibile
    if (window.innerWidth < 992) setShowReportsSidebar(false);
  };

  const handleAddReport = () => {
    if (isAuthenticated) navigate("/report/new");
    else setShowAuthModal(true);
  };

  // --- Load reports --------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingReports(true);
      setReportsError(null);

      try {
        const data = await getReportsApi();
        if (!mounted) return;

        // visibilità: stati "approvati" + i pending dell'utente loggato
        const approvedStatuses = new Set<string>([
          String(ReportStatus.ASSIGNED),
          String(ReportStatus.EXTERNAL_ASSIGNED),
          String(ReportStatus.IN_PROGRESS),
          String(ReportStatus.RESOLVED),
        ]);

        const visible = (data || []).filter((r: any) => {
          if (approvedStatuses.has(String(r.status))) return true;
          if (isAuthenticated && user?.email && r?.user?.email === user.email) return true;
          return false;
        });

        setReports(normalizeReports(visible));
      } catch (err: any) {
        console.error("Failed to load reports:", err);
        if (!mounted) return;
        setReportsError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingReports(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.email, refreshTrigger]);

  // redirect admin
  useEffect(() => {
    if (isAdmin) navigate("/admin", { replace: true });
  }, [isAdmin, navigate]);

  // Ripristina scroll sidebar quando cambi selezione
  useEffect(() => {
    const sidebar = document.querySelector(".reports-sidebar-scroll") as HTMLElement | null;
    if (sidebar && sidebarScrollRef.current > 0) sidebar.scrollTop = sidebarScrollRef.current;
  }, [selectedReportId]);

  // --- Derived data --------------------------------------------------------

  const recentReports = useMemo(() => getRecentReports(reports), [reports]);

  const selectedReport = useMemo(() => {
    if (selectedReportId == null) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const handleReportCardClick = (reportId: number) => {
    saveSidebarScroll(sidebarScrollRef);
    setSelectedReportId(reportId);
    setShowReportsSidebar(false);
  };

  // CTA button: stessa logica ovunque
  const FooterCTA = () => {
    if (isPublicRelations) {
      return (
        <Button onClick={() => navigate("/assign-reports")} variant="primary" fullWidth>
          <Pencil className="me-2" />
          Manage reports
        </Button>
      );
    }

    if (!isAuthenticated || isCitizen) {
      return (
        <Button onClick={handleAddReport} variant="primary" fullWidth>
          <Pencil className="me-2" />
          Select a location
        </Button>
      );
    }

    if (isTechnicalOfficer) {
      return (
        <Button onClick={() => navigate("/assign-reports")} variant="primary" fullWidth>
          <Pencil className="me-2" />
          My Reports
        </Button>
      );
    }

    return null;
  };

  const LoginHint = () => {
    if (isAuthenticated) return null;
    return (
      <p className="text-center text-muted mb-0 mt-3" style={{ fontSize: "0.85rem" }}>
        You need to{" "}
        <button
          onClick={() => navigate("/login")}
          className="btn btn-link p-0"
          style={{ color: "var(--primary)", textDecoration: "underline", fontSize: "inherit" }}
        >
          login
        </button>{" "}
        or{" "}
        <button
          onClick={() => navigate("/signup")}
          className="btn btn-link p-0"
          style={{ color: "var(--primary)", textDecoration: "underline", fontSize: "inherit" }}
        >
          sign up
        </button>{" "}
        to submit reports
      </p>
    );
  };

  // Sidebar content riusabile
  const ReportsSidebarContent = () => (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 1.5rem 1rem 1.5rem",
          borderBottom: "2px solid #f8f9fa",
          background: "#fdfdfd",
        }}
      >
        <div>
          <h3 style={{ color: "var(--text)", margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
            Recent Reports
          </h3>
          <small style={{ color: "#6c757d", display: "block", marginTop: "0.25rem" }}>
            Showing the 10 most recent reports
          </small>
        </div>
      </div>

      <div
        className="reports-sidebar-scroll"
        style={{
          flex: 1,
          padding: "1.5rem",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db #f9fafb",
        }}
      >
        {loadingReports ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            Loading reports...
          </div>
        ) : reportsError ? (
          <div style={{ color: "var(--danger)", padding: "1rem" }}>
            Error loading reports: {reportsError}
          </div>
        ) : reports.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentReports.map((report) => {
              const isOwnReport = isUserOwnReport(report, isAuthenticated, user);
              return (
                <div key={report.id} style={{ position: "relative" }}>
                  {isOwnReport && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        background: "#e0f7fa",
                        color: "#00796b",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        padding: "2px 8px",
                        borderRadius: "0 0 0.5rem 0",
                        zIndex: 2,
                      }}
                    >
                      Your report
                    </div>
                  )}

                  <ReportCard
                    report={report}
                    isSelected={selectedReportId === report.id}
                    onClick={() => handleReportCardClick(report.id)}
                    onOpenDetails={handleReportDetailsClick}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#adb5bd",
              padding: "2rem 1rem",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>
              <Clipboard />
            </div>
            <p style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#6c757d", fontWeight: 500 }}>
              No reports yet
            </p>
            <small style={{ fontSize: "0.9rem", lineHeight: 1.4, color: "#adb5bd" }}>
              Reports will appear here once submitted by citizens.
            </small>
          </div>
        )}
      </div>

      <div style={{ padding: "1.5rem", borderTop: "1px solid #f8f9fa", background: "#fdfdfd" }}>
        <FooterCTA />
        <LoginHint />
      </div>
    </>
  );

  // --- Render --------------------------------------------------------------

  return (
    <>
      <div style={{ height: "100%", background: "var(--bg)", overflow: "hidden" }}>
        <main style={{ height: "100%", display: "flex", position: "relative" }}>
          {/* Map Section */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "1rem",
                paddingTop: "2rem",
              }}
              className="px-md-4"
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <MapView
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onReportDetailsClick={handleReportDetailsClick}
                />
              </div>
            </div>

            {/* Floating button for mobile */}
            <button
              onClick={() => setShowReportsSidebar(true)}
              className="d-lg-none btn btn-primary position-fixed rounded-circle shadow-lg"
              style={{
                bottom: "2rem",
                right: "2rem",
                width: "60px",
                height: "60px",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              <List />
            </button>
          </div>

          {/* Reports Sidebar - Desktop */}
          <div
            className="d-none d-lg-flex"
            style={{
              width: "350px",
              minWidth: "350px",
              maxWidth: "350px",
              background: "var(--surface)",
              flexDirection: "column",
              height: "100%",
              boxShadow: "-2px 0 16px rgba(34, 49, 63, 0.04)",
            }}
          >
            <ReportsSidebarContent />
          </div>
        </main>

        {/* Reports Sidebar - Mobile (Offcanvas) */}
        <Offcanvas
          show={showReportsSidebar}
          onHide={() => setShowReportsSidebar(false)}
          placement="end"
          style={{ width: "90%", maxWidth: "400px" }}
        >
          <Offcanvas.Header closeButton style={{ borderBottom: "2px solid #f8f9fa", background: "#fdfdfd" }}>
            <Offcanvas.Title style={{ color: "var(--text)", fontSize: "1.3rem", fontWeight: 700 }}>
              Recent Reports
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="p-0 d-flex flex-column" style={{ background: "var(--surface)" }}>
            {/* stessa sidebar content, così non hai divergenze */}
            <ReportsSidebarContent />
          </Offcanvas.Body>
        </Offcanvas>
      </div>

      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {selectedReport && (
        <ReportDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          report={selectedReport}
          onReportUpdate={handleReportUpdate}
        />
      )}
    </>
  );
}
