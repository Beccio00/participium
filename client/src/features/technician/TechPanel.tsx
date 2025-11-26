import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Container, Row, Col, Modal, Form } from "react-bootstrap";
import { CheckCircle, XCircle } from "react-bootstrap-icons"; 
import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getReports, getPendingReports, rejectReport, getAssignableTechnicals, approveReport } from "../../api/api"; 
import type { Report as AppReport } from "../../types/report.types";
import ReportCard from "../reports/ReportCard";
import "../../styles/TechPanelstyle.css";

const ALLOWED_ROLES = [
  "PUBLIC_RELATIONS",
  "CULTURE_EVENTS_TOURISM_SPORTS",
  "LOCAL_PUBLIC_SERVICES",
  "EDUCATION_SERVICES",
  "PUBLIC_RESIDENTIAL_HOUSING",
  "INFORMATION_SYSTEMS",
  "MUNICIPAL_BUILDING_MAINTENANCE",
  "PRIVATE_BUILDINGS",
  "INFRASTRUCTURES",
  "GREENSPACES_AND_ANIMAL_PROTECTION",
  "WASTE_MANAGEMENT",
  "ROAD_MAINTENANCE",
  "CIVIL_PROTECTION"
];

export default function TechPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<AppReport[]>([]);
  const [pendingReports, setPendingReports] = useState<AppReport[]>([]);
  const [otherReports, setOtherReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignableTechnicals, setAssignableTechnicals] = useState<any[]>([]);
  const [selectedTechnicalId, setSelectedTechnicalId] = useState<number | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const isPublicRelations = user?.role === "PUBLIC_RELATIONS";

  useEffect(() => {
    if (!isAuthenticated || (user?.role  && !ALLOWED_ROLES.includes(user.role))) { 
      navigate("/"); 
    }
    fetchReports();
  }, [isAuthenticated, user, navigate]); 

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (isPublicRelations) {
        // Public Relations: fetch both pending and other reports
        const pendingData = (await getPendingReports()) as AppReport[];
        const otherData = (await getReports()) as AppReport[];

        const pendingNormalized = (pendingData || []).map((r: any) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));

        const otherNormalized = (otherData || []).map((r: any) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));

        setPendingReports(pendingNormalized);
        setOtherReports(otherNormalized);
      } else {
        const data = (await getReports()) as AppReport[];
        // Normalize latitude/longitude to numbers (API returns strings to satisfy OpenAPI schema)
        const normalized = (data || []).map((r: any) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));
        setReports(normalized);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (id: number) => {
    try {
      setProcessingId(id);
      const list = await getAssignableTechnicals(id);
      setAssignableTechnicals(list || []);
      setSelectedReportId(id);
      // preselect first technical if available
      setSelectedTechnicalId(list && list.length > 0 ? list[0].id : null);
      setShowAssignModal(true);
    } catch (err) {
      console.error('Failed to fetch assignable technicals', err);
      alert('Failed to fetch assignable technicals');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedReportId || !selectedTechnicalId) return;
    try {
      setProcessingId(selectedReportId);
      const res = await approveReport(selectedReportId, selectedTechnicalId);
      // API returns { message, report }
      const updatedReport = res && res.report ? res.report : null;
      if (updatedReport) {
        const normalized = {
          ...updatedReport,
          latitude: Number((updatedReport as any).latitude),
          longitude: Number((updatedReport as any).longitude),
        } as AppReport;
        // remove from pending and add to otherReports (top)
        setPendingReports((prev) => prev.filter((r) => r.id !== selectedReportId));
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowAssignModal(false);
    } catch (err) {
      console.error('Failed to approve report', err);
      alert((err as any)?.message || 'Failed to approve report');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedReportId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedReportId || !rejectionReason.trim()) return;

    try {
      setProcessingId(selectedReportId);
      const res = await rejectReport(selectedReportId, rejectionReason);
      const updatedReport = res && res.report ? res.report : null;
      if (updatedReport) {
        const normalized = {
          ...updatedReport,
          latitude: Number((updatedReport as any).latitude),
          longitude: Number((updatedReport as any).longitude),
        } as AppReport;
        setPendingReports((prev) => prev.filter((r) => r.id !== selectedReportId));
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowRejectModal(false);
    } catch (err) {
      console.error('Failed to reject report', err);
      alert((err as any)?.message || 'Failed to reject report');
    } finally {
      setProcessingId(null);
    }
  };

  // statusVariant is now implemented in ReportCard; TechPanel no longer needs it

  if (loading) return <div className="loading-container"><LoadingSpinner /></div>;

  return (
    <Container className="py-4 tech-panel-container">
      <div className="mb-4">
        <h2 className="tech-panel-title">Reports Management</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isPublicRelations ? (
        <>
          {/* Top: all non-pending reports shown as cards side-by-side */}
          <div className="mb-4">
            <h4>All Reports</h4>
            {otherReports.length === 0 ? (
              <p className="text-muted">No non-pending reports available.</p>
            ) : (
              <Row>
                {otherReports.map((report) => (
                  <Col key={report.id} lg={4} md={6} className="mb-3">
                    <ReportCard report={report} />
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Bottom: pending reports with actions */}
          <div>
            <h4>Pending Reports</h4>
            {pendingReports.length === 0 ? (
              <p className="text-muted">No pending reports.</p>
            ) : (
              <Row>
                {pendingReports.map((report) => (
                  <Col key={report.id} lg={6} xl={4} className="mb-4">
                    <div className="h-100 shadow-sm report-card d-flex flex-column">
                      <ReportCard report={report} />
                      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6', marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <Button variant="danger" className="flex-fill d-flex align-items-center justify-content-center" onClick={() => openRejectModal(report.id)} disabled={processingId === report.id}><XCircle className="me-2" /> Reject</Button>
                        <Button variant="primary" className="flex-fill d-flex align-items-center justify-content-center" onClick={() => openAssignModal(report.id)} disabled={processingId === report.id} isLoading={processingId === report.id}><CheckCircle className="me-2" /> Accept</Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </>
      ) : (
        // Non-PR users: keep existing single list behavior
        (reports.length === 0 && !error) ? (
          <div className="empty-state">
            <h4>No reports found</h4>
            <p>No active reports assigned to your department.</p>
          </div>
        ) : (
          <Row>
            {reports.map((report) => (
              <Col key={report.id} lg={6} xl={4} className="mb-4">
                <ReportCard report={report} />
              </Col>
            ))}
          </Row>
        )
      )}

      {/* rejection */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please provide a reason for rejecting this report. This will be visible to the citizen.</p>
          <Form.Group>
            <Form.Label>Reason for Rejection *</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Duplicate report, private property, insufficient information..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejectConfirm}
            disabled={!rejectionReason.trim() || processingId !== null}
            isLoading={processingId === selectedReportId}
          >
            Confirm Rejection
          </Button>
        </Modal.Footer>
      </Modal>
      {/* assign modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a technical user to assign this report to:</p>
          <Form.Group>
            <Form.Select value={selectedTechnicalId ?? ""} onChange={(e) => setSelectedTechnicalId(Number(e.target.value))}>
              <option value="">-- Select technical --</option>
              {assignableTechnicals.map((t) => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.role})</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmAssign} disabled={!selectedTechnicalId} isLoading={processingId !== null}>
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
