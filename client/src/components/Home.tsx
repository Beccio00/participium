import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clipboard, Pencil } from "react-bootstrap-icons";
import AuthModal from "./AuthModal";
import "../styles/Home.css";
import MapView from "./MapView";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Mock reports data
  const [reports] = useState([
    {
      id: 1,
      title: "Broken street light on Via Roma",
      description:
        "The street light at the corner of Via Roma and Via Milano has been out for a week.",
      category: "Public Lighting",
      status: "In Progress",
      createdAt: "2025-11-10",
      latitude: 45.0703,
      longitude: 7.6869,
      address: "Via Roma, 10100 Torino TO, Italy",
    },
    {
      id: 2,
      title: "Pothole on Corso Vittorio",
      description:
        "Large pothole causing traffic issues near the central station.",
      category: "Road Maintenance",
      status: "Assigned",
      createdAt: "2025-11-08",
      latitude: 45.0653,
      longitude: 7.6789,
      address: "Corso Vittorio Emanuele II, 10100 Torino TO, Italy",
    },
    {
      id: 3,
      title: "Overflowing trash bin",
      description:
        "Trash bin on Piazza Castello is overflowing and needs emptying.",
      category: "Waste",
      status: "Resolved",
      createdAt: "2025-11-05",
      latitude: 45.0733,
      longitude: 7.6839,
      address: "Piazza Castello, 10100 Torino TO, Italy",
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

  const handleModalLogin = () => {
    setShowAuthModal(false);
    navigate("/login");
  };

  const handleModalSignup = () => {
    setShowAuthModal(false);
    navigate("/signup");
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
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
                <MapView
                  reports={reports}
                  selectedReportId={selectedReportId}
                />
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
                    <div
                      key={report.id}
                      className={`report-item ${
                        selectedReportId === report.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedReportId(report.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="report-header">
                        <h4 className="report-title">{report.title}</h4>
                        <span
                          className={`report-status status-${report.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="report-description">{report.description}</p>
                      <div className="report-meta">
                        <span className="report-location">
                          {report.address}
                        </span>
                        <span className="report-date">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="reports-placeholder">
                  <div className="placeholder-icon">
                    <Clipboard />
                  </div>
                  <p>No reports yet</p>
                  <small>
                    Reports will appear here once submitted by citizens.
                  </small>
                </div>
              )}
            </div>

            <div className="add-report-section">
              <button onClick={handleAddReport} className="add-report-btn">
                <span className="btn-icon">
                  <Pencil />
                </span>
                Add New Report
              </button>

              {!isAuthenticated && (
                <p className="auth-reminder">
                  <small>
                    You need to{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="link-btn"
                    >
                      login
                    </button>{" "}
                    or{" "}
                    <button
                      onClick={() => navigate("/signup")}
                      className="link-btn"
                    >
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

      <AuthModal
        isOpen={showAuthModal}
        isAuthenticated={isAuthenticated}
        onClose={handleCloseModal}
        onLogin={handleModalLogin}
        onSignup={handleModalSignup}
      />
    </>
  );
}
