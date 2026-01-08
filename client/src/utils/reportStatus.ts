import { ReportStatus } from "../../../shared/ReportTypes";

/**
 * Transforms report status enum values to human-readable format
 * @param status - The report status enum value
 * @returns A formatted, human-readable status string
 * 
 * @example
 * formatReportStatus(ReportStatus.EXTERNAL_ASSIGNED) // "External Assigned"
 * formatReportStatus(ReportStatus.PENDING_APPROVAL) // "Pending Approval"
 */
export function formatReportStatus(status: ReportStatus): string {
  const statusMap: Record<ReportStatus, string> = {
    [ReportStatus.PENDING_APPROVAL]: "Pending Approval",
    [ReportStatus.ASSIGNED]: "Assigned",
    [ReportStatus.EXTERNAL_ASSIGNED]: "External Assigned",
    [ReportStatus.REJECTED]: "Rejected",
    [ReportStatus.IN_PROGRESS]: "In Progress",
    [ReportStatus.SUSPENDED]: "Suspended",
    [ReportStatus.RESOLVED]: "Resolved",
  };

  return statusMap[status] || status;
}
