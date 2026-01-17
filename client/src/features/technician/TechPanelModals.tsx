import { Modal, Form, Alert, Toast, ToastContainer } from "react-bootstrap";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ReportDetailsModal from "../reports/ReportDetailsModal";
import type {
  Report as AppReport,
  InternalNote,
} from "../../types/report.types";
import { getRoleLabel } from "../../utils/roles";

interface TechPanelModalsProps {
  // Reject Modal
  showRejectModal: boolean;
  onCloseRejectModal: () => void;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  onConfirmReject: () => void;

  // Assign Modal
  showAssignModal: boolean;
  onCloseAssignModal: () => void;
  isPublicRelations: boolean;
  assignableExternals: any[];
  assignableTechnicals: any[];
  selectedExternalId: number | null;
  onExternalIdChange: (id: number | null) => void;
  selectedTechnicalId: number | null;
  onTechnicalIdChange: (id: number | null) => void;
  selectedCompany: any;
  onConfirmAssign: () => void;

  // Status Modal
  showStatusModal: boolean;
  onCloseStatusModal: () => void;
  targetStatus: string;
  onTargetStatusChange: (value: string) => void;
  availableStatusOptions: Array<{ value: string; label: string }>;
  onConfirmStatus: () => void;

  // Internal Note Modal
  showInternalNoteModal: boolean;
  onCloseInternalNoteModal: () => void;
  internalNoteContent: string;
  onInternalNoteContentChange: (value: string) => void;
  internalNotes: InternalNote[];
  loadingNotes: boolean;
  noteModalError: string | null;
  onCloseNoteModalError: () => void;
  onSubmitInternalNote: () => void;
  formatDate: (date: Date | string) => string;

  // Details Modal
  showDetailsModal: boolean;
  onCloseDetailsModal: () => void;
  selectedReport: AppReport | null;

  // Toast
  toast: { show: boolean; message: string; variant: string };
  onCloseToast: () => void;

  // Common
  processingId: number | null;
  selectedReportId: number | null;
}

export default function TechPanelModals({
  showRejectModal,
  onCloseRejectModal,
  rejectionReason,
  onRejectionReasonChange,
  onConfirmReject,
  showAssignModal,
  onCloseAssignModal,
  isPublicRelations,
  assignableExternals,
  assignableTechnicals,
  selectedExternalId,
  onExternalIdChange,
  selectedTechnicalId,
  onTechnicalIdChange,
  selectedCompany,
  onConfirmAssign,
  showStatusModal,
  onCloseStatusModal,
  targetStatus,
  onTargetStatusChange,
  availableStatusOptions,
  onConfirmStatus,
  showInternalNoteModal,
  onCloseInternalNoteModal,
  internalNoteContent,
  onInternalNoteContentChange,
  internalNotes,
  loadingNotes,
  noteModalError,
  onCloseNoteModalError,
  onSubmitInternalNote,
  formatDate,
  showDetailsModal,
  onCloseDetailsModal,
  selectedReport,
  toast,
  onCloseToast,
  processingId,
  selectedReportId,
}: TechPanelModalsProps) {
  // Helper function to render notes history - avoids nested ternary
  const renderNotesHistory = () => {
    if (loadingNotes) {
      return (
        <div className="text-center py-3">
          <LoadingSpinner />
        </div>
      );
    }
    if (internalNotes.length === 0) {
      return (
        <p className="text-muted small fst-italic">
          No internal notes found for this report.
        </p>
      );
    }
    return (
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
        }}
      >
        {internalNotes.map((note) => (
          <div
            key={note.id}
            className="mb-3 pb-3 border-bottom last-child-no-border"
          >
            <div className="d-flex justify-content-between align-items-start mb-1">
              <strong>
                {note.authorName}{" "}
                <span
                  className="text-muted"
                  style={{ fontSize: "0.85em", fontWeight: "normal" }}
                >
                  ({getRoleLabel(note.authorRole)})
                </span>
              </strong>
              <span className="text-muted small" style={{ fontSize: "0.8em" }}>
                {formatDate(note.createdAt)}
              </span>
            </div>
            <p className="mb-0 small" style={{ whiteSpace: "pre-wrap" }}>
              {note.content}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 1. REJECT MODAL */}
      <Modal show={showRejectModal} onHide={onCloseRejectModal} centered>
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
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder="E.g., Duplicate report, private property, insufficient information..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCloseRejectModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirmReject}
            disabled={!rejectionReason.trim() || processingId !== null}
            isLoading={processingId === selectedReportId}
          >
            Confirm Rejection
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. ASSIGN MODAL */}
      <Modal show={showAssignModal} onHide={onCloseAssignModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isPublicRelations ? (
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
                      onExternalIdChange(val);
                      onTechnicalIdChange(null);
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

              {selectedCompany?.hasPlatformAccess &&
                Array.isArray(selectedCompany.users) &&
                selectedCompany.users.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select a company technician:</Form.Label>
                    <Form.Select
                      value={selectedTechnicalId ?? ""}
                      onChange={(e) =>
                        onTechnicalIdChange(Number(e.target.value))
                      }
                    >
                      <option value="">-- Select technical --</option>
                      {selectedCompany.users.map((tech: any) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.firstName} {tech.lastName} ({tech.email})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
            </>
          ) : (
            <>
              <p>Select a technical user to assign this report to:</p>
              <Form.Group>
                <Form.Select
                  value={selectedTechnicalId ?? ""}
                  onChange={(e) => onTechnicalIdChange(Number(e.target.value))}
                >
                  <option value="">-- Select technical --</option>
                  {assignableTechnicals.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({getRoleLabel(t.role)})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCloseAssignModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmAssign}
            disabled={
              !isPublicRelations ? !selectedExternalId : !selectedTechnicalId
            }
            isLoading={processingId !== null}
          >
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. STATUS UPDATE MODAL */}
      <Modal show={showStatusModal} onHide={onCloseStatusModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Report Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select the new status for this report:</p>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={targetStatus}
              onChange={(e) => onTargetStatusChange(e.target.value)}
            >
              <option value="">-- Select Status --</option>
              {availableStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCloseStatusModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmStatus}
            disabled={!targetStatus || processingId === selectedReportId}
            isLoading={processingId === selectedReportId}
          >
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 4. DETAILS MODAL */}
      {selectedReport && (
        <ReportDetailsModal
          show={showDetailsModal}
          onHide={onCloseDetailsModal}
          report={selectedReport}
        />
      )}

      {/* 5. INTERNAL NOTE MODAL */}
      <Modal
        show={showInternalNoteModal}
        onHide={onCloseInternalNoteModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Internal Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {noteModalError && (
            <Alert variant="danger" onClose={onCloseNoteModalError} dismissible>
              {noteModalError}
            </Alert>
          )}
          <div className="mb-4">
            <h6 className="mb-3">History</h6>
            {renderNotesHistory()}
          </div>

          <hr />

          <h6 className="mb-3">Add New Note</h6>
          <p className="text-muted small">
            This note will be visible to other technicians and admins, but{" "}
            <strong>not</strong> to the citizen.
          </p>
          <Form.Group>
            <Form.Label>Note Content *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={internalNoteContent}
              onChange={(e) => onInternalNoteContentChange(e.target.value)}
              placeholder="Enter internal note content here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCloseInternalNoteModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={onSubmitInternalNote}
            disabled={!internalNoteContent.trim() || processingId !== null}
            isLoading={processingId !== null}
          >
            Save Note
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 6. TOAST */}
      <ToastContainer
        position="top-center"
        className="p-3"
        style={{ zIndex: 9999, position: "fixed" }}
      >
        <Toast
          onClose={onCloseToast}
          show={toast.show}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Body
            className={
              toast.variant === "dark" ||
              toast.variant === "danger" ||
              toast.variant === "success"
                ? "text-white"
                : ""
            }
          >
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
