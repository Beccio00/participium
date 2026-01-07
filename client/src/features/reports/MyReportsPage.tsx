import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Clipboard } from "react-bootstrap-icons";
import { useAuth } from "../../hooks";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AccessRestricted from "../../components/AccessRestricted";
import SearchAndFilterBar from "../../components/ui/SearchAndFilterBar";
import EmptyState from "../../components/ui/EmptyState";
import { getMyReports } from "../../api/api";
import { userHasRole } from "../../utils/roles";
import type { Report as AppReport } from "../../types/report.types";
import ReportCard from "./ReportCard";
import ReportDetailsModal from "./ReportDetailsModal";
import { Role } from "../../../../shared/RoleTypes";
import "../../styles/TechPanelstyle.css";

// Helper functions
function normalizeReports(reports: any[]): AppReport[] {
  return (reports || []).map((r: any) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

export default function MyReportsPage() {
  const { user, isAuthenticated } = useAuth();

  const [reports, setReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Details modal state
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const isCitizen = userHasRole(user, Role.CITIZEN);

  useEffect(() => {
    // Fetch reports if authenticated and citizen
    if (isAuthenticated && isCitizen) {
      fetchMyReports();
    }
  }, [isAuthenticated, user, isCitizen]);
  
  // Check access before loading
  if (!isAuthenticated || !isCitizen) {
    const message = !isAuthenticated
      ? "You need to be logged in as a citizen to view your reports."
      : "Only citizens can view their reports.";
    
    return <AccessRestricted message={message} showLoginButton={!isAuthenticated} />;
  }

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use dedicated endpoint that returns all user's reports (including anonymous)
      const myReports = (await getMyReports()) as AppReport[];
      
      // Sort by creation date (newest first)
      const sorted = myReports.toSorted((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      
      setReports(normalizeReports(sorted));
    } catch (err) {
      console.error("Error fetching my reports:", err);
      setError("Failed to load your reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportDetailsClick = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);
  };

  const handleReportUpdate = (updatedReport: AppReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  // Filter function
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = !searchTerm || 
        report.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || report.status === filterStatus;
      const matchesCategory = !filterCategory || report.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [reports, searchTerm, filterStatus, filterCategory]);

  // Extract available statuses and categories
  const availableStatuses = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.status).filter(Boolean)));
  }, [reports]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.category).filter(Boolean)));
  }, [reports]);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-muted">Loading your reports...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4 text-center">
        <h2 style={{ color: "var(--text)", fontWeight: 700 }}>My Reports</h2>
        <p className="text-muted">
          View all reports you have submitted to the municipality.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          availableStatuses={availableStatuses}
          availableCategories={availableCategories}
        />
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState
          icon={<Clipboard />}
          title={reports.length === 0 ? "No reports yet" : "No matching reports"}
          description={
            reports.length === 0
              ? "You haven't submitted any reports yet. Go back to the home page to create your first report!"
              : "Try adjusting your search or filter criteria."
          }
        />
      ) : (
        <Row>
          {filteredReports.map((report) => (
            <Col key={report.id} lg={4} md={6} className="mb-4">
              <div className="h-100 shadow-sm report-card">
                <ReportCard
                  report={report}
                  onOpenDetails={handleReportDetailsClick}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {selectedReport && (
        <ReportDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          report={selectedReport}
          onReportUpdate={handleReportUpdate}
        />
      )}
    </Container>
  );
}
