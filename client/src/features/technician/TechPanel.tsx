import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Container, Row, Col, Modal, Form } from "react-bootstrap";
import { CheckCircle, XCircle, Tools } from "react-bootstrap-icons";
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
  updateReportStatus,
} from "../../api/api";
import type { Report as AppReport } from "../../types/report.types";
import ReportCard from "../reports/ReportCard";
import ReportDetailsModal from "../reports/ReportDetailsModal";
import { MUNICIPALITY_AND_EXTERNAL_ROLES,  TECHNICIAN_ROLES} from "../../utils/roles";
import { Role } from "../../../../shared/RoleTypes";
import { ReportStatus } from "../../../../shared/ReportTypes";
import "../../styles/TechPanelstyle.css";

export default function TechPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [pendingReports, setPendingReports] = useState<AppReport[]>([]);
  const [otherReports, setOtherReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Selection state
  const [assignableTechnicals, setAssignableTechnicals] = useState<any[]>([]);
  const [assignableExternals, setAssignableExternals] = useState<any[]>([]);
  const [selectedTechnicalId, setSelectedTechnicalId] = useState<number | null>(
    null
  );
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null
  );
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form data state
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const isPublicRelations = user?.role === Role.PUBLIC_RELATIONS.toString();
  const isExternalMaintainer = user?.role === Role.EXTERNAL_MAINTAINER.toString();

  const TECHNICAL_ALLOWED_STATUSES = [
    { value: ReportStatus.IN_PROGRESS.toString(), label: "In Progress" },
    { value: ReportStatus.RESOLVED.toString(), label: "Resolved" },
    { value: ReportStatus.SUSPENDED.toString(), label: "Work suspended" },
  ];

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

        const pendingNormalized = (assignedData || [])
          .filter(
            (r: any) =>
              r.status === ReportStatus.EXTERNAL_ASSIGNED.toString() ||
              TECHNICAL_ALLOWED_STATUSES.map((s) => s.value).includes(r.status)
          )
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

        // Separate into pending (Assigned to me directly) and assigned to external
        const pendingNormalized = (assignedData || [])
          .filter(
            (r: any) =>
              r.status === ReportStatus.ASSIGNED.toString() ||
              TECHNICAL_ALLOWED_STATUSES.map((s) => s.value).includes(r.status)
          )
          .map((r: any) => ({
            ...r,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));

        const otherNormalized = (assignedData || [])
          .filter((r: any) => r.status === ReportStatus.EXTERNAL_ASSIGNED.toString())
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

  // --- ASSIGNMENT LOGIC ---

  const openAssignModal = async (id: number) => {
    try {
      setProcessingId(id);
      let technicals = [];
      let externals = [];

      if (user && user.role === Role.PUBLIC_RELATIONS.toString()) {
        try {
          technicals = await getAssignableTechnicals(id);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable technicals",
            err
          );
          setError("Errore nel recupero dei tecnici assegnabili.");
          setProcessingId(null);
          return;
        }
      } else if (user && TECHNICIAN_ROLES.includes(user.role)) {
        try {
          externals = await getAssignableExternals(id);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable externals",
            err
          );
          setError("Errore nel recupero delle compagnie esterne assegnabili.");
          setProcessingId(null);
          return;
        }
      }
      setAssignableTechnicals(technicals || []);
      setAssignableExternals(externals || []);

      setSelectedReportId(id);
      setSelectedTechnicalId(
        technicals && technicals.length > 0 ? technicals[0].id : null
      );
      setSelectedExternalId(
        externals && externals.length > 0 ? externals[0].id : null
      );
      setShowAssignModal(true);
    } catch (err) {
      setError("Errore inatteso nell’apertura della modale di assegnazione.");
      console.error("[TechPanel] Errore inatteso openAssignModal", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReportDetailsClick = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);
    setTimeout(() => {
      const reportCard = document.querySelector(`[data-report-id="${reportId}"]`) as HTMLElement;
      if (reportCard) reportCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleConfirmAssign = async () => {
    if (!selectedReportId) return;
    try {
      setProcessingId(selectedReportId);
      let updatedReport = null;

      // PUBLIC_RELATIONS: assign to technical user
      if (user && user.role === Role.PUBLIC_RELATIONS.toString() && selectedTechnicalId) {
        const res = await approveReport(selectedReportId, selectedTechnicalId);
        updatedReport = res && res.report ? res.report : null;
      }
      // Technical office: assign to external company or technician
      else if (user && selectedExternalId) {
        const selectedCompany = assignableExternals.find(
          (ext) => ext.id === selectedExternalId
        );
        // Check if specific technician is selected within company
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

        // Move report from pending to other
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

  // --- STATUS UPDATE LOGIC (For Technicians) ---

  const openStatusModal = (id: number) => {
    setSelectedReportId(id);
    setTargetStatus("");
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedReportId || !targetStatus) return;

    try {
      setProcessingId(selectedReportId);
      await updateReportStatus(selectedReportId, targetStatus);

      // Update local state to reflect change immediately without refetching everything
      setPendingReports((prev) =>
        prev.map((r) =>
          r.id === selectedReportId ? { ...r, status: targetStatus } : r
        )
      );

      setShowStatusModal(false);
      setSelectedReportId(null);
      setTargetStatus("");
    } catch (err) {
      console.error("Failed to update status", err);
      alert((err as any)?.message || "Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  // --- REJECTION LOGIC (For PR) ---

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
          {/* --- PUBLIC RELATIONS VIEW --- */}

          {/* Top: all non-pending reports */}
          <div className="mb-4">
            <h4>All Reports</h4>
            {otherReports.length === 0 ? (
              <p className="text-muted">No non-pending reports available.</p>
            ) : (
              <Row>
                {otherReports.map((report) => (
                  <Col key={report.id} lg={4} md={6} className="mb-3">
                    <ReportCard report={report} onOpenDetails={handleReportDetailsClick} />
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Bottom: pending reports with Approve/Reject actions */}
          <div>
            <h4>Pending Reports</h4>
            {pendingReports.length === 0 ? (
              <p className="text-muted">No pending reports.</p>
            ) : (
              <Row>
                {pendingReports.map((report) => (
                  <Col key={report.id} lg={6} xl={4} className="mb-4">
                    <div className="h-100 shadow-sm report-card d-flex flex-column">
                      <ReportCard report={report} onOpenDetails={handleReportDetailsClick} />
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
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </>
      ) : (
        <>
          {/* --- TECHNICAL OFFICE & EXTERNAL VIEW --- */}

          <div>
            <h4>Assigned to me</h4>
            {pendingReports.length === 0 ? (
              <p className="text-muted">No reports assigned to you.</p>
            ) : (
              <Row>
                {pendingReports.map((report) => (
                  <Col key={report.id} lg={6} xl={4} className="mb-4">
                    <div className="h-100 shadow-sm report-card d-flex flex-column">
                      <ReportCard report={report} onOpenDetails={handleReportDetailsClick} />

                      {/* Show actions for both Technical Office and Externals */}
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderTop: "1px solid #f3f4f6",
                          marginTop: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {/* UPDATE STATUS: Visible for both */}
                        <Button
                          variant="primary"
                          className="w-100 d-flex align-items-center justify-content-center"
                          onClick={() => openStatusModal(report.id)}
                          disabled={processingId === report.id}
                        >
                          <Tools className="me-2" />
                          Update Status
                        </Button>

                        {/* ASSIGN TO EXTERNAL: Visible ONLY for Technical Office (NOT External Maintainers) */}
                        {!isExternalMaintainer && (() => {
                          const disabledByStatus = report.status !== "ASSIGNED";
                          const assignDisabled = processingId === report.id || disabledByStatus;
                          const tooltip = disabledByStatus
                            ? "A report can be assigned to an external company only when its status is ASSIGNED. Once it moves to IN_PROGRESS it can no longer be assigned externally."
                            : "";

                          // Native tooltips don't show on disabled elements in some browsers,
                          // so attach the title to a wrapper when disabled by status.
                          const Wrapper: any = (props: any) => (
                            <div
                              title={assignDisabled && tooltip ? tooltip : undefined}
                              style={{ width: "100%" }}
                            >
                              {props.children}
                            </div>
                          );

                          return (
                            <Wrapper>
                              <Button
                                variant="primary"
                                className="w-100 d-flex align-items-center justify-content-center"
                                onClick={() => openAssignModal(report.id)}
                                disabled={assignDisabled}
                                isLoading={
                                  processingId === report.id && showAssignModal
                                }
                              >
                                <CheckCircle className="me-2" />
                                Assign to external
                              </Button>
                            </Wrapper>
                          );
                        })()}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Show 'Assigned to External' only for technical office */}
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
                        <ReportCard report={report} onOpenDetails={handleReportDetailsClick} />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </>
      )}

      {/* --- MODALS --- */}

      {/* 1. REJECT MODAL */}
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

      {/* 2. ASSIGN MODAL */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Technical office: select company and optionally technician */}
          {!isPublicRelations && user && (
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

              {/* Se la compagnia ha dipendenti, select dei tecnici */}
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
          )}

          {/* Public Relations: select technical user */}
          {isPublicRelations && (
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
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmAssign}
            disabled={
              !isPublicRelations
                ? (() => {
                    if (!selectedExternalId) return true;
                    // If company has maintainers, technician is required? usually optional unless enforced
                    return false;
                  })()
                : !selectedTechnicalId
            }
            isLoading={processingId !== null}
          >
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. STATUS UPDATE MODAL (New) */}
      <Modal
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Report Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select the new status for this report:</p>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
            >
              <option value="">-- Select Status --</option>
              {TECHNICAL_ALLOWED_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusConfirm}
            disabled={!targetStatus || processingId === selectedReportId}
            isLoading={processingId === selectedReportId}
          >
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
      {selectedReportId !== null && (
        (() => {
          const allReports = [...pendingReports, ...otherReports];
          const reportToShow = allReports.find((r) => r.id === selectedReportId);
          return reportToShow ? (
            <ReportDetailsModal
              show={showDetailsModal}
              onHide={() => setShowDetailsModal(false)}
              report={reportToShow}
            />
          ) : null;
        })()
      )}
    </Container>
  );
}