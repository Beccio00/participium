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
import { ReportCategory } from "../../../../shared/ReportTypes";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showReportsSidebar, setShowReportsSidebar] = useState(false);

  // Mock reports data - TODO: Replace with API call
  const [reports] = useState<Report[]>([
    {
      id: 1,
      title: "Broken street light on Via Roma",
      description: "The street light at the corner of Via Roma and Via Milano has been out for a week.",
      category: ReportCategory.PUBLIC_LIGHTING,
      status: "In Progress",
      createdAt: "2025-11-10",
      latitude: 45.0703,
      longitude: 7.6869,
    },
    {
      id: 2,
      title: "Pothole on Corso Vittorio",
      description: "Large pothole causing traffic issues near the central station.",
      category: ReportCategory.ROADS_URBAN_FURNISHINGS,
      status: "Assigned",
      createdAt: "2025-11-08",
      latitude: 45.0653,
      longitude: 7.6789,
    },
    {
      id: 3,
      title: "Overflowing trash bin",
      description: "Trash bin on Piazza Castello is overflowing and needs emptying.",
      category: ReportCategory.WASTE,
      status: "Resolved",
      createdAt: "2025-11-05",
      latitude: 45.0733,
      longitude: 7.6839,
    },
  ]);

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
            <small style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#adb5bd' }}>Reports will appear here once submitted by citizens.</small>
          </div>
        )}
      </div>

      {/* Add Report Button */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid #f8f9fa', background: '#fdfdfd' }}>
        {(!isAuthenticated || user?.role === "CITIZEN") && (
          <Button onClick={handleAddReport} variant="primary" fullWidth>
            <Pencil className="me-2" />
            Select a location
          </Button>
        )}

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
                  <small style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#adb5bd' }}>Reports will appear here once submitted by citizens.</small>
                </div>
              )}
            </div>

            {/* Add Report Button */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #f8f9fa', background: '#fdfdfd' }}>
              {(!isAuthenticated || user?.role === "CITIZEN") && (
                <Button onClick={handleAddReport} variant="primary" fullWidth>
                  <Pencil className="me-2" />
                  Select a location
                </Button>
              )}

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
