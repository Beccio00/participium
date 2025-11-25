import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Container, Row, Col, Card, Badge, Modal, Form } from "react-bootstrap";
import { CheckCircle, XCircle, GeoAlt } from "react-bootstrap-icons"; 
import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getReports, updateReportStatus } from "../../api/api"; 
import type { Report as AppReport } from "../../types/report.types";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
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
      const data = await getReports() as AppReport[];

      let filteredReports : AppReport[] = [];
     
      if (isPublicRelations) {
        filteredReports = data.filter(r=>
          (r.status === "APPROVED" || r.status === "ASSIGNED")
        )
      }else{

      }
      setReports(filteredReports);
    } catch (err) {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await updateReportStatus(id, "APPROVED");
      
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to approve report");
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
      await updateReportStatus(selectedReportId, "REJECTED", rejectionReason);
      
      setReports(prev => prev.filter(r => r.id !== selectedReportId));
      setShowRejectModal(false);
    } catch (err) {
      alert("Failed to reject report");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="loading-container"><LoadingSpinner /></div>;

  return (
    <Container className="py-4 tech-panel-container">
      <div className="mb-4">
        <h2 className="tech-panel-title">
          {isPublicRelations ? "Public Relations Dashboard" : "Department Dashboard"}
        </h2>
        <p className="text-muted">
          {isPublicRelations 
            ? "Review incoming reports and assign status." 
            : `Managing active reports for ${user?.role?.replace(/_/g, " ")}`}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {reports.length === 0 && !error ? (
        <div className="empty-state">
          <h4>No reports found</h4>
          <p>
            {isPublicRelations 
              ? "All incoming reports have been processed." 
              : "No active reports assigned to your department."}
          </p>
        </div>
      ) : (
        <Row>
          {reports.map((report) => (
            <Col key={report.id} lg={6} xl={4} className="mb-4">
              <Card className="h-100 shadow-sm report-card">
                {report.photos && report.photos.length > 0 && (
                  <div className="report-img-wrapper">
                    <img 
                      src={report.photos[0].url} 
                      alt="Report" 
                      className="report-img"
                    />
                  </div>
                )}
                
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="info" className="text-uppercase">{report.category}</Badge>
                    <small className="text-muted">{new Date(report.createdAt || "").toLocaleDateString()}</small>
                  </div>
                  
                  <Card.Title className="report-card-title">{report.title}</Card.Title>
                  <Card.Text className="report-card-text">
                    {report.description}
                  </Card.Text>
                  
                  <div className="mb-3 text-muted small">
                    <div className="d-flex align-items-center mb-1">
                      <GeoAlt className="me-2" />
                      {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                    </div>
                  </div>

                  <hr className="report-divider" />

                  {/* Public Relations */}
                  {isPublicRelations ? (
                    <div className="d-flex gap-2 mt-auto">
                      <Button 
                        variant="danger"
                        className="flex-fill d-flex align-items-center justify-content-center"
                        onClick={() => openRejectModal(report.id)}
                        disabled={processingId === report.id}
                      >
                        <XCircle className="me-2" /> Reject
                      </Button>
                      <Button 
                        variant="primary" 
                        className="flex-fill d-flex align-items-center justify-content-center"
                        onClick={() => handleApprove(report.id)}
                        disabled={processingId === report.id}
                        isLoading={processingId === report.id}
                      >
                        <CheckCircle className="me-2" /> Accept
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-auto text-center">
                      <Badge bg="success" className="p-2 w-100">
                        Assigned to your Department
                      </Badge>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
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
    </Container>
  );
}
