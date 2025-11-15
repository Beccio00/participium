import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clipboard, Pencil } from "react-bootstrap-icons";
import { useAuth } from "../../hooks";
import { Button } from "../../components/ui";
import { AuthRequiredModal } from "../auth/AuthRequiredModal";
import { ReportCard } from "./ReportCard";
import MapView from "../../components/MapView";
import type { Report } from "../../types";
import "./HomePage.css";

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Mock reports data - TODO: Replace with API call
  const [reports] = useState<Report[]>([
    {
      id: 1,
      title: "Broken street light on Via Roma",
      description: "The street light at the corner of Via Roma and Via Milano has been out for a week.",
      category: "PUBLIC_LIGHTING",
      status: "In Progress",
      createdAt: "2025-11-10",
      latitude: 45.0703,
      longitude: 7.6869,
    },
    {
      id: 2,
      title: "Pothole on Corso Vittorio",
      description: "Large pothole causing traffic issues near the central station.",
      category: "ROADS_URBAN_FURNISHINGS",
      status: "Assigned",
      createdAt: "2025-11-08",
      latitude: 45.0653,
      longitude: 7.6789,
    },
    {
      id: 3,
      title: "Overflowing trash bin",
      description: "Trash bin on Piazza Castello is overflowing and needs emptying.",
      category: "WASTE",
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

  return (
    <>
      <div className="home-container">
        <main className="main-content">
          <div className="map-section">
            <div className="map-placeholder">
              <div className="map-header">
                <h2>Interactive Map</h2>
                <p>Municipality territory view</p>
              </div>
              <div className="map-content">
                <MapView reports={reports} selectedReportId={selectedReportId} />
              </div>
            </div>
          </div>

          <div className="reports-section">
            <div className="reports-header">
              <h3>Recent Reports</h3>
              <span className="reports-count">{reports.length}</span>
            </div>

            <div className="reports-content">
              {reports.length > 0 ? (
                <div className="reports-list">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      isSelected={selectedReportId === report.id}
                      onClick={() => setSelectedReportId(report.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="reports-placeholder">
                  <div className="placeholder-icon">
                    <Clipboard />
                  </div>
                  <p>No reports yet</p>
                  <small>Reports will appear here once submitted by citizens.</small>
                </div>
              )}
            </div>

            <div className="add-report-section">
              {(!isAuthenticated || user?.role === "CITIZEN") && (
                <Button onClick={handleAddReport} variant="primary" fullWidth>
                  <span className="btn-icon">
                    <Pencil />
                  </span>
                  Select a location
                </Button>
              )}

              {!isAuthenticated && (
                <p className="auth-reminder">
                  <small>
                    You need to{" "}
                    <button onClick={() => navigate("/login")} className="link-btn">
                      login
                    </button>{" "}
                    or{" "}
                    <button onClick={() => navigate("/signup")} className="link-btn">
                      sign up
                    </button>{" "}
                    to submit reports
                  </small>
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
