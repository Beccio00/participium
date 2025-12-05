import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Container, Row, Col, Modal, Form } from "react-bootstrap";
import { CheckCircle, XCircle } from "react-bootstrap-icons";
import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  getReports,
  getPendingReports,
  rejectReport,
  getAssignableTechnicals,
  approveReport,
  getAssignedReports,
  getAssignableExternals,
  assignReportToExternal,
} from "../../api/api";
import type { Report as AppReport } from "../../types/report.types";
import ReportCard from "../reports/ReportCard";
import { MUNICIPALITY_AND_EXTERNAL_ROLES } from "../../utils/roles";
import "../../styles/TechPanelstyle.css";

export default function TechPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [pendingReports, setPendingReports] = useState<AppReport[]>([]);
  const [otherReports, setOtherReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignableTechnicals, setAssignableTechnicals] = useState<any[]>([]);
  const [assignableExternals, setAssignableExternals] = useState<any[]>([]);
  const [selectedTechnicalId, setSelectedTechnicalId] = useState<number | null>(
    null
  );
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null
  );
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const isPublicRelations = user?.role === "PUBLIC_RELATIONS";
  const isExternalMaintainer = user?.role === "EXTERNAL_MAINTAINER";

  useEffect(() => {
    if (
      !isAuthenticated ||
      (user?.role && !MUNICIPALITY_AND_EXTERNAL_ROLES.includes(user.role))
    ) {
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
      } else if (isExternalMaintainer) {
        // External maintainer: only show EXTERNAL_ASSIGNED reports as "Assigned to me"
        const assignedData = (await getAssignedReports()) as AppReport[];
        console.log("[TechPanel] Assigned reports fetched:", assignedData);

        const pendingNormalized = (assignedData || [])
          .filter((r: any) => r.status === "EXTERNAL_ASSIGNED")
          .map((r: any) => ({
            ...r,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));

        setPendingReports(pendingNormalized);
        setOtherReports([]);
      } else {
        // Technical office: fetch assigned reports
        const assignedData = (await getAssignedReports()) as AppReport[];
        console.log("[TechPanel] Assigned reports fetched:", assignedData);

        // Separate into pending (ASSIGNED status) and assigned to external (EXTERNAL_ASSIGNED status)
        const pendingNormalized = (assignedData || [])
          .filter((r: any) => r.status === "ASSIGNED")
          .map((r: any) => ({
            ...r,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));

        const otherNormalized = (assignedData || [])
          .filter((r: any) => r.status === "EXTERNAL_ASSIGNED")
          .map((r: any) => ({
            ...r,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));

        setPendingReports(pendingNormalized);
        setOtherReports(otherNormalized);
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
      let technicals = [];
      let externals = [];
      const technicalRoles = [
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
        "CIVIL_PROTECTION",
      ];
      if (user && user.role === "PUBLIC_RELATIONS") {
        try {
          technicals = await getAssignableTechnicals(id);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable technicals",
            err
          );
          setError(
            "Errore nel recupero dei tecnici assegnabili: " +
              ((err && (err as any)?.message) || "")
          );
          setProcessingId(null);
          return;
        }
      } else if (user && technicalRoles.includes(user.role)) {
        try {
          externals = await getAssignableExternals(id);
          console.log("[TechPanel] Assignable externals:", externals);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable externals",
            err
          );
          setError(
            "Errore nel recupero delle compagnie esterne assegnabili: " +
              ((err && (err as any)?.message) || "")
          );
          setProcessingId(null);
          return;
        }
      }
      setAssignableTechnicals(technicals || []);
      setAssignableExternals(externals || []);
      console.log("[TechPanel] Set assignableExternals:", externals || []);
      setSelectedReportId(id);
      setSelectedTechnicalId(
        technicals && technicals.length > 0 ? technicals[0].id : null
      );
      setSelectedExternalId(
        externals && externals.length > 0 ? externals[0].id : null
      );
      setShowAssignModal(true);
    } catch (err) {
      setError(
        "Errore inatteso nell’apertura della modale di assegnazione: " +
          ((err && (err as any)?.message) || "")
      );
      console.error("[TechPanel] Errore inatteso openAssignModal", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedReportId) return;
    try {
      setProcessingId(selectedReportId);
      let updatedReport = null;

      // PUBLIC_RELATIONS: assign to technical user
      if (user && user.role === "PUBLIC_RELATIONS" && selectedTechnicalId) {
        const res = await approveReport(selectedReportId, selectedTechnicalId);
        updatedReport = res && res.report ? res.report : null;
      }
      // Technical office: assign to external company or technician
      else if (
        user &&
        [
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
          "CIVIL_PROTECTION",
        ].includes(user.role) &&
        selectedExternalId
      ) {
        // Se la compagnia ha users e uno è selezionato, assegna a tecnico, altrimenti a compagnia
        const selectedCompany = assignableExternals.find(
          (ext) => ext.id === selectedExternalId
        );
        if (
          selectedCompany &&
          selectedCompany.hasPlatformAccess &&
          Array.isArray(selectedCompany.users) &&
          selectedCompany.users.length > 0 &&
          selectedTechnicalId
        ) {
          const res = await assignReportToExternal(
            selectedReportId,
            selectedExternalId,
            selectedTechnicalId
          );
          updatedReport = res && res.report ? res.report : null;
        } else {
          const res = await assignReportToExternal(
            selectedReportId,
            selectedExternalId,
            null
          );
          updatedReport = res && res.report ? res.report : null;
        }
      }

      if (updatedReport) {
        const normalized = {
          ...updatedReport,
          latitude: Number((updatedReport as any).latitude),
          longitude: Number((updatedReport as any).longitude),
        } as AppReport;

        // Both PUBLIC_RELATIONS and technical office: move report from pending to other
        setPendingReports((prev) =>
          prev.filter((r) => r.id !== selectedReportId)
        );
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowAssignModal(false);
      setSelectedReportId(null);
      setSelectedTechnicalId(null);
      setSelectedExternalId(null);
    } catch (err) {
      console.error("[TechPanel] Failed to assign report:", err);
      alert(
        "Failed to assign report: " +
          ((err as any)?.message || JSON.stringify(err))
      );
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
        setPendingReports((prev) =>
          prev.filter((r) => r.id !== selectedReportId)
        );
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowRejectModal(false);
    } catch (err) {
      console.error("Failed to reject report", err);
      alert((err as any)?.message || "Failed to reject report");
    } finally {
      setProcessingId(null);
    }
  };

  // statusVariant is now implemented in ReportCard; TechPanel no longer needs it

  if (loading)
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );

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
                      {/* Show approve/reject controls only for PUBLIC_RELATIONS */}
                      {user && user.role === "PUBLIC_RELATIONS" && (
                        <div
                          style={{
                            padding: "0.75rem 1rem",
                            borderTop: "1px solid #f3f4f6",
                            marginTop: "auto",
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
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
                            onClick={() => openAssignModal(report.id)}
                            disabled={processingId === report.id}
                            isLoading={processingId === report.id}
                          >
                            <CheckCircle className="me-2" /> Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </>
      ) : (
        // Non-PR technical office users and external maintainers
        <>
          <div>
            <h4>Assigned to me</h4>
            {pendingReports.length === 0 ? (
              <p className="text-muted">No reports assigned to you.</p>
            ) : (
              <Row>
                {pendingReports.map((report) => (
                  <Col key={report.id} lg={6} xl={4} className="mb-4">
                    <div className="h-100 shadow-sm report-card d-flex flex-column">
                      <ReportCard report={report} />
                      {/* Show assign button only for technical office users, not external maintainers */}
                      {!isExternalMaintainer && (
                        <div
                          style={{
                            padding: "0.75rem 1rem",
                            borderTop: "1px solid #f3f4f6",
                            marginTop: "auto",
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <Button
                            variant="primary"
                            className="flex-fill d-flex align-items-center justify-content-center"
                            onClick={() => openAssignModal(report.id)}
                            disabled={processingId === report.id}
                            isLoading={processingId === report.id}
                          >
                            <CheckCircle className="me-2" />
                            Assign to external maintainer
                          </Button>
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Show 'Assigned to External' section only for technical office users, not external maintainers */}
          {!isExternalMaintainer && (
            <div className="mt-5">
              <h4>Assigned to External</h4>
              {otherReports.length === 0 ? (
                <p className="text-muted">
                  No reports assigned to externals yet.
                </p>
              ) : (
                <Row>
                  {otherReports.map((report) => (
                    <Col key={report.id} lg={6} xl={4} className="mb-4">
                      <div className="h-100 shadow-sm report-card d-flex flex-column">
                        <ReportCard report={report} />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </>
      )}

      {/* rejection */}
      <Modal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reject Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please provide a reason for rejecting this report. This will be
            visible to the citizen.
          </p>
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
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Technical office users: select company and optionally technician */}
          {user &&
          [
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
            "CIVIL_PROTECTION",
          ].includes(user.role) ? (
            <>
              <p>Seleziona una compagnia esterna:</p>
              {assignableExternals.length === 0 ? (
                <div className="text-muted">
                  Non ci sono compagnie esterne per questa categoria.
                </div>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Select
                    value={selectedExternalId ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSelectedExternalId(val);
                      setSelectedTechnicalId(null);
                    }}
                  >
                    <option value="">-- Seleziona compagnia --</option>
                    {assignableExternals.map((ext) => (
                      <option key={ext.id} value={ext.id}>
                        {ext.name || ext.first_name + " " + ext.last_name}
                        {ext.company_name ? ` (${ext.company_name})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* Se la compagnia selezionata ha dipendenti, mostra la select obbligatoria dei tecnici */}
              {(() => {
                const selectedCompany = assignableExternals.find(
                  (ext) => ext.id === selectedExternalId
                );
                if (
                  selectedCompany &&
                  selectedCompany.hasPlatformAccess &&
                  Array.isArray(selectedCompany.users) &&
                  selectedCompany.users.length > 0
                ) {
                  return (
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Seleziona un tecnico della compagnia:
                      </Form.Label>
                      <Form.Select
                        value={selectedTechnicalId ?? ""}
                        onChange={(e) =>
                          setSelectedTechnicalId(Number(e.target.value))
                        }
                      >
                        <option value="">-- Seleziona tecnico --</option>
                        {selectedCompany.users.map((tech: any) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.firstName} {tech.lastName} ({tech.email})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  );
                }
                return null;
              })()}
            </>
          ) : null}

          {/* Public Relations: select technical user */}
          {user && user.role === "PUBLIC_RELATIONS" ? (
            <>
              <p>Select a technical user to assign this report to:</p>
              <Form.Group>
                <Form.Select
                  value={selectedTechnicalId ?? ""}
                  onChange={(e) =>
                    setSelectedTechnicalId(Number(e.target.value))
                  }
                >
                  <option value="">-- Select technical --</option>
                  {assignableTechnicals.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.role})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmAssign}
            disabled={
              user &&
              [
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
                "CIVIL_PROTECTION",
              ].includes(user.role)
                ? (() => {
                    const selectedCompany = assignableExternals.find(
                      (ext) => ext.id === selectedExternalId
                    );
                    if (!selectedExternalId) return true;
                    if (
                      selectedCompany &&
                      Array.isArray(selectedCompany.maintainers) &&
                      selectedCompany.maintainers.length > 0
                    ) {
                      return !selectedTechnicalId;
                    }
                    return false;
                  })()
                : user && user.role === "PUBLIC_RELATIONS"
                ? !selectedTechnicalId
                : true
            }
            isLoading={processingId !== null}
          >
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
