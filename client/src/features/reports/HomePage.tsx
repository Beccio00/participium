import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clipboard, Pencil, List } from "react-bootstrap-icons";
import { Offcanvas } from "react-bootstrap";
import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import AuthRequiredModal from "../auth/AuthRequiredModal.tsx";
import ReportCard from "./ReportCard.tsx";
import MapView from "../../components/MapView";
import type { Report } from "../../types";
import { getReports as getReportsApi } from "../../api/api";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showReportsSidebar, setShowReportsSidebar] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const isTechnicalOfficer = isAuthenticated && user?.role && !["CITIZEN", "ADMINISTRATOR","PUBLIC_RELATIONS"].includes(user.role);

  // load reports from backend and filter statuses: appending, in progress, complete
  useEffect(() => {
    // Re-load reports when authentication state or user changes so that
    // newly created reports (PENDING_APPROVAL) by the current user are shown.
    let mounted = true;
    async function load() {
      setLoadingReports(true);
      setReportsError(null);
      try {
        const data = await getReportsApi();
        if (!mounted) return;
        // Ensure citizens see their own pending reports even if backend didn't include them
        const approvedStatuses = ["ASSIGNED", "IN_PROGRESS", "RESOLVED"];
        const visible = (data || []).filter((r: any) => {
          if (approvedStatuses.includes(r.status)) return true;
          if (isAuthenticated && user && r.user && r.user.email === user.email) return true;
          return false;
        });
        // Ensure latitude/longitude are numbers (API may return strings to satisfy OpenAPI schema)
        const normalized = visible.map((r: any) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));
        setReports(normalized);
      } catch (err: any) {
        console.error("Failed to load reports:", err);
        if (!mounted) return;
        setReportsError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingReports(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMINISTRATOR") {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleAddReport = () => {
    if (isAuthenticated) {
      navigate("/report/new");
    } else {
      setShowAuthModal(true);
    }
  };

  const ReportsSidebarContent = () => (
    <>
      {/* Reports Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '2px solid #f8f9fa', background: '#fdfdfd' }}>
        <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Recent Reports</h3>
        <span style={{ background: 'var(--text)', color: 'var(--surface)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
          {reports.length}
        </span>
      </div>

      {/* Reports List */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {loadingReports ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>Caricamento report...</div>
        ) : reportsError ? (
          <div style={{ color: 'var(--danger)', padding: '1rem' }}>Errore nel caricamento: {reportsError}</div>
        ) : reports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReportId === report.id}
                onClick={() => {
                  setSelectedReportId(report.id);
                  setShowReportsSidebar(false);
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#adb5bd', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
              <Clipboard />
            </div>
            <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#6c757d', fontWeight: 500 }}>No reports yet</p>
            <small style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#adb5bd' }}>Reports will appear here once submitted by citizens.</small>
          </div>
        )}
      </div>

      
      <div style={{ padding: '1.5rem', borderTop: '1px solid #f8f9fa', background: '#fdfdfd' }}>
        {isAuthenticated && user?.role === "PUBLIC_RELATIONS" ? (
          <Button onClick={() => navigate('/assign-reports')} variant="primary" fullWidth>
            <Pencil className="me-2" />
            Manage reports
          </Button>
        ) : (!isAuthenticated || user?.role === "CITIZEN") ? (
          <Button onClick={handleAddReport} variant="primary" fullWidth>
            <Pencil className="me-2" />
            Select a location
          </Button>
        ) :  isTechnicalOfficer ? (
          <Button onClick={() => navigate('/assign-reports')} variant="primary" fullWidth>
            <Pencil className="me-2" />
            My Reports
          </Button>
        ) : null}

        {!isAuthenticated && (
          <p className="text-center text-muted mb-0 mt-3" style={{ fontSize: '0.85rem' }}>
            You need to{" "}
            <button
              onClick={() => navigate("/login")}
              className="btn btn-link p-0"
              style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: 'inherit' }}
            >
              login
            </button>{" "}
            or{" "}
            <button
              onClick={() => navigate("/signup")}
              className="btn btn-link p-0"
              style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: 'inherit' }}
            >
              sign up
            </button>{" "}
            to submit reports
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      <div style={{ height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
        <main style={{ height: '100%', display: 'flex', position: 'relative' }}>
          {/* Map Section */}
          <div style={{ flex: 1, minWidth: 0, background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', paddingTop: '2rem' }} className="px-md-4">
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text)', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Interactive Map</h2>
                <p style={{ color: '#666', margin: 0, fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Municipality territory view</p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <MapView reports={reports} selectedReportId={selectedReportId} />
              </div>
            </div>

            {/* Floating button for mobile */}
            <button
              onClick={() => setShowReportsSidebar(true)}
              className="d-lg-none btn btn-primary position-fixed rounded-circle shadow-lg"
              style={{
                bottom: '2rem',
                right: '2rem',
                width: '60px',
                height: '60px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              <List />
            </button>
          </div>

          {/* Reports Sidebar - Desktop */}
          <div className="d-none d-lg-flex" style={{ width: '350px', minWidth: '350px', maxWidth: '350px', background: 'var(--surface)', flexDirection: 'column', height: '100%', boxShadow: '-2px 0 16px rgba(34, 49, 63, 0.04)' }}>
            <ReportsSidebarContent />
          </div>
        </main>

        {/* Reports Sidebar - Mobile (Offcanvas) */}
        <Offcanvas
          show={showReportsSidebar}
          onHide={() => setShowReportsSidebar(false)}
          placement="end"
          style={{ width: '90%', maxWidth: '400px' }}
        >
          <Offcanvas.Header closeButton style={{ borderBottom: '2px solid #f8f9fa', background: '#fdfdfd' }}>
            <Offcanvas.Title style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700 }}>
              Recent Reports
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0 d-flex flex-column" style={{ background: 'var(--surface)' }}>
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {reports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      isSelected={selectedReportId === report.id}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setShowReportsSidebar(false);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#adb5bd', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
                    <Clipboard />
                  </div>
                  <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#6c757d', fontWeight: 500 }}>No reports yet</p>
                  <small style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#adb5bd' }}>Reports will appear here..</small>
                </div>
              )}
            </div>

            {/* Add Report Button */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #f8f9fa', background: '#fdfdfd' }}>
              {isAuthenticated && user?.role === "PUBLIC_RELATIONS" ? (
                <Button onClick={() => navigate('/assign-reports')} variant="primary" fullWidth>
                  <Pencil className="me-2" />
                  Assegna technical
                </Button>
              ) : (!isAuthenticated || user?.role === "CITIZEN") ? (
                <Button onClick={handleAddReport} variant="primary" fullWidth>
                  <Pencil className="me-2" />
                  Select a location
                </Button>
              ) : null}

              {!isAuthenticated && (
                <p className="text-center text-muted mb-0 mt-3" style={{ fontSize: '0.85rem' }}>
                  You need to{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="btn btn-link p-0"
                    style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: 'inherit' }}
                  >
                    login
                  </button>{" "}
                  or{" "}
                  <button
                    onClick={() => navigate("/signup")}
                    className="btn btn-link p-0"
                    style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: 'inherit' }}
                  >
                    sign up
                  </button>{" "}
                  to submit reports
                </p>
              )}
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </div>

      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
