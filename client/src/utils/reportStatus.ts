import { ReportStatus } from "../../../shared/ReportTypes";
import type { ReportCategory } from "../types/report.types";

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

/**
 * Transforms report category enum values to human-readable format
 * Removes underscores and converts to title case
 * @param category - The report category enum value
 * @returns A formatted, human-readable category string
 *
 * @example
 * formatReportCategory("ROADS_URBAN_FURNISHINGS") // "Roads Urban Furnishings"
 * formatReportCategory("PUBLIC_LIGHTING") // "Public Lighting"
 */
export function formatReportCategory(
  category: ReportCategory | string
): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
