import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Container, Row, Col, Modal, Form, Toast, ToastContainer, Alert } from "react-bootstrap";
import { CheckCircle, XCircle, Tools, FileText } from "react-bootstrap-icons";
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
  createInternalNote,
  getInternalNotes,
} from "../../api/api";
import type { Report as AppReport, InternalNote } from "../../types/report.types";
import ReportCard from "../reports/ReportCard";
import ReportDetailsModal from "../reports/ReportDetailsModal";
import { MUNICIPALITY_AND_EXTERNAL_ROLES,  TECHNICIAN_ROLES, getRoleLabel } from "../../utils/roles";
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
  const [showInternalNoteModal, setShowInternalNoteModal] = useState(false);

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
  const [internalNoteContent, setInternalNoteContent] = useState("");

  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const isPublicRelations = user?.role === Role.PUBLIC_RELATIONS.toString();
  const isExternalMaintainer = user?.role === Role.EXTERNAL_MAINTAINER.toString();

  const [noteModalError, setNoteModalError] = useState<string | null>(null);
  const [toast, setToast] = useState({show: false, message: "", variant: "success" });
  const showToastMessage = (message: string, variant = "success") => {
    setToast({ show: true, message, variant });
  };

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
        // External maintainer: show reports assigned to this external maintainer
        const assignedData = (await getAssignedReports()) as AppReport[];

        const pendingNormalized = (assignedData || [])
          .filter((r: any) => {
            const handlerUserId =
              r.externalHandler && r.externalHandler.user && "id" in r.externalHandler.user
                ? r.externalHandler.user.id
                : undefined;
            return Boolean(handlerUserId && user && (user as any).id != null && handlerUserId === (user as any).id);
          })
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
              (r.status === ReportStatus.ASSIGNED.toString() ||
                TECHNICAL_ALLOWED_STATUSES.map((s) => s.value).includes(r.status)) &&
              !Boolean(r.externalHandler)
          )
          .map((r: any) => ({
            ...r,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));

        const otherNormalized = (assignedData || [])
          .filter((r: any) => Boolean(r.externalHandler))
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

    // Prevent updating to the same status
    const currentReport = [...pendingReports, ...otherReports].find(
      (r) => r.id === selectedReportId
    );
    if (currentReport && currentReport.status === targetStatus) {
      alert("The selected status is the same as the current status.");
      return;
    }

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

  const openNoteModal = async (id: number) => {
    setSelectedReportId(id);
    setInternalNoteContent("");
    setInternalNotes([]);
    setNoteModalError(null);
    setShowInternalNoteModal(true);

    try {
      setLoadingNotes(true);
      const notes = await getInternalNotes(id);
      setInternalNotes(notes);
    } catch (e) {
      console.error("Failed to fetch internal notes", e);
      setNoteModalError("Failed to load internal notes.");
    } finally {
      setLoadingNotes(false);
    }
  }

  const handleInternalNoteSubmit = async () =>{
    if (!selectedReportId || !internalNoteContent.trim()) return;

    try{
      setProcessingId(selectedReportId);
       await createInternalNote(selectedReportId, {
        reportId: selectedReportId,
        content: internalNoteContent,
        authorId: user!.id,
      });

      setShowInternalNoteModal(false);
      showToastMessage("Internal note created successfully", "success");
    }catch(e){
      console.error("Failed to create internal note", e);
      setNoteModalError("Failed to create internal note.");
    }finally{
      setProcessingId(null);
    }
  }
  

  const formatDate = (dateString: Date | string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
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
                        {/* INTERNAL NOTES BUTTON (not for Public Relations) */}
                        {!isPublicRelations && (
                        <Button 
                          variant="primary" 
                          className="w-100 d-flex align-items-center justify-content-center"
                          onClick={() => openNoteModal(report.id)}
                          disabled={processingId === report.id}
                          >
                          <FileText className="me-2" /> Internal Notes
                      </Button>
                        )}
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
              <h4>Assigned by me to External</h4>
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

                          <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f3f4f6", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <Button 
                              variant="primary" 
                              className="w-100 d-flex align-items-center justify-content-center"
                              onClick={() => openNoteModal(report.id)}
                              disabled={processingId === report.id}
                              >
                              <FileText className="me-2" /> Internal Notes
                            </Button>
                          </div>
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
              <p>Select an external company:</p>
              {assignableExternals.length === 0 ? (
                <div className="text-muted">
                  No external companies available for this category.
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
                    <option value="">-- Select company --</option>
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
                        Select a company technician:
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
                {(() => {
                  const currentStatus = [...pendingReports, ...otherReports].find((r) => r.id === selectedReportId)?.status;
                  return TECHNICAL_ALLOWED_STATUSES
                    .filter((s) => s.value !== currentStatus)
                    .map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ));
                })()}
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


      {/* internal note modal */}
      <Modal show={showInternalNoteModal} onHide={() => setShowInternalNoteModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Internal Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {noteModalError && (
            <Alert variant="danger" onClose={() => setNoteModalError(null)} dismissible>
              {noteModalError}
            </Alert>
          )}
          <div className="mb-4">
            <h6 className="mb-3">History</h6>
            {loadingNotes ? (
              <div className="text-center py-3"><LoadingSpinner /></div>
            ) : internalNotes.length === 0 ? (
              <p className="text-muted small fst-italic">No internal notes found for this report.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px', backgroundColor: '#f8f9fa' }}>
                {internalNotes.map((note) => (
                  <div key={note.id} className="mb-3 pb-3 border-bottom last-child-no-border">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong>{note.authorName} <span className="text-muted" style={{ fontSize: '0.85em', fontWeight: 'normal' }}>({getRoleLabel(note.authorRole)})</span></strong>
                      <span className="text-muted small" style={{ fontSize: '0.8em' }}>{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr />

          <h6 className="mb-3">Add New Note</h6>
          <p className="text-muted small">
            This note will be visible to other technicians and admins, but <strong>not</strong> to the citizen.
          </p>
          <Form.Group>
            <Form.Label>Note Content *</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              value={internalNoteContent}
              onChange={(e) => setInternalNoteContent(e.target.value)}
              placeholder="Enter internal note content here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInternalNoteModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleInternalNoteSubmit} disabled={!internalNoteContent.trim() || processingId !== null} isLoading={processingId !== null}>
            Save Note
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-center" className="p-3" style={{ zIndex: 9999, position: 'fixed' }}>
        <Toast 
          onClose={() => setToast({ ...toast, show: false })} 
          show={toast.show} 
          delay={3000} 
          autohide 
          bg={toast.variant}
        >
          <Toast.Body className={toast.variant === 'dark' || toast.variant === 'danger' || toast.variant === 'success' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );

}
