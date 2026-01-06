import { Row, Col } from "react-bootstrap";
import { CheckCircle, XCircle, Tools, FileText } from "react-bootstrap-icons";
import type { Report as AppReport } from "../../types/report.types";
import ReportCard from "../reports/ReportCard";
import Button from "../../components/ui/Button";

interface AssignToExternalButtonProps {
  report: AppReport;
  processingId: number | null;
  showAssignModal: boolean;
  onOpenAssignModal: (id: number) => void;
}

function AssignToExternalButton({
  report,
  processingId,
  showAssignModal,
  onOpenAssignModal,
}: AssignToExternalButtonProps) {
  const disabledByStatus = report.status !== "ASSIGNED";
  const assignDisabled = processingId === report.id || disabledByStatus;
  const tooltip = disabledByStatus
    ? "A report can be assigned to an external company only when its status is ASSIGNED. Once it moves to IN_PROGRESS it can no longer be assigned externally."
    : "";

  return (
    <div
      title={assignDisabled && tooltip ? tooltip : undefined}
      style={{ width: "100%" }}
    >
      <Button
        variant="primary"
        className="w-100 d-flex align-items-center justify-content-center"
        onClick={() => onOpenAssignModal(report.id)}
        disabled={assignDisabled}
        isLoading={processingId === report.id && showAssignModal}
      >
        <CheckCircle className="me-2" />
        Assign to external
      </Button>
    </div>
  );
}

interface ReportsListProps {
  reports: AppReport[];
  variant: "public-relations-all" | "public-relations-pending" | "technical-assigned" | "technical-external";
  processingId: number | null;
  onOpenDetails: (id: number) => void;
  onReject?: (id: number) => void;
  onAssign?: (id: number) => void;
  onStatusUpdate?: (id: number) => void;
  onOpenNotes?: (id: number) => void;
  isExternalMaintainer?: boolean;
  showAssignModal?: boolean;
}

export default function ReportsList({
  reports,
  variant,
  processingId,
  onOpenDetails,
  onReject,
  onAssign,
  onStatusUpdate,
  onOpenNotes,
  isExternalMaintainer = false,
  showAssignModal = false,
}: ReportsListProps) {
  const renderPublicRelationsAll = (report: AppReport) => (
    <Col key={report.id} lg={4} md={6} className="mb-3">
      <ReportCard report={report} onOpenDetails={onOpenDetails} />
    </Col>
  );

  const renderPublicRelationsPending = (report: AppReport) => (
    <Col key={report.id} lg={6} xl={4} className="mb-4">
      <div className="h-100 shadow-sm report-card d-flex flex-column">
        <ReportCard report={report} onOpenDetails={onOpenDetails} />
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6', marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="danger" 
            className="flex-fill d-flex align-items-center justify-content-center" 
            onClick={() => onReject?.(report.id)} 
            disabled={processingId === report.id}
          >
            <XCircle className="me-2" /> Reject
          </Button>
          <Button 
            variant="primary" 
            className="flex-fill d-flex align-items-center justify-content-center" 
            onClick={() => onAssign?.(report.id)} 
            disabled={processingId === report.id} 
            isLoading={processingId === report.id}
          >
            <CheckCircle className="me-2" /> Accept
          </Button>
        </div>
      </div>
    </Col>
  );

  const renderTechnicalAssigned = (report: AppReport) => (
    <Col key={report.id} lg={6} xl={4} className="mb-4">
      <div className="h-100 shadow-sm report-card d-flex flex-column">
        <ReportCard report={report} onOpenDetails={onOpenDetails} />
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
          <Button
            variant="primary"
            className="w-100 d-flex align-items-center justify-content-center"
            onClick={() => onStatusUpdate?.(report.id)}
            disabled={processingId === report.id}
          >
            <Tools className="me-2" />
            Update Status
          </Button>
          {!isExternalMaintainer && (
            <AssignToExternalButton
              report={report}
              processingId={processingId}
              showAssignModal={showAssignModal}
              onOpenAssignModal={(id) => onAssign?.(id)}
            />
          )}
          <Button 
            variant="primary" 
            className="w-100 d-flex align-items-center justify-content-center"
            onClick={() => onOpenNotes?.(report.id)}
            disabled={processingId === report.id}
          >
            <FileText className="me-2" /> Internal Notes
          </Button>
        </div>
      </div>
    </Col>
  );

  const renderTechnicalExternal = (report: AppReport) => (
    <Col key={report.id} lg={6} xl={4} className="mb-4">
      <div className="h-100 shadow-sm report-card d-flex flex-column">
        <ReportCard report={report} onOpenDetails={onOpenDetails} />
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f3f4f6", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Button 
            variant="primary" 
            className="w-100 d-flex align-items-center justify-content-center"
            onClick={() => onOpenNotes?.(report.id)}
            disabled={processingId === report.id}
          >
            <FileText className="me-2" /> Internal Notes
          </Button>
        </div>
      </div>
    </Col>
  );

  const renderReport = (report: AppReport) => {
    switch (variant) {
      case "public-relations-all":
        return renderPublicRelationsAll(report);
      case "public-relations-pending":
        return renderPublicRelationsPending(report);
      case "technical-assigned":
        return renderTechnicalAssigned(report);
      case "technical-external":
        return renderTechnicalExternal(report);
      default:
        return null;
    }
  };

  return (
    <Row>
      {reports.map(renderReport)}
    </Row>
  );
}
