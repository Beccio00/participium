import { Badge } from "react-bootstrap";
import type { Report } from "../../types";
// onOpenDetails prop allows parent to open the shared details modal

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: () => void;
  onOpenDetails?: (reportId: number) => void;
}

function statusVariant(status?: string) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "#f59e0b"; // warning - orange
    case "ASSIGNED":
      return "#3b82f6"; // primary - blue
    case "EXTERNAL_ASSIGNED":
      return "#8b5cf6"; // purple - for external assignment
    case "IN_PROGRESS":
      return "#06b6d4"; // info - cyan
    case "RESOLVED":
      return "#10b981"; // success - green
    case "REJECTED":
      return "#ef4444"; // danger - red
    case "SUSPENDED":
      return "#6b7280"; // secondary - gray
    default:
      return "#374151"; // dark
  }
}

export default function ReportCard({
  report,
  isSelected = false,
  onClick,
  onOpenDetails,
}: ReportCardProps) {
  // Ensure status is uppercase to match backend enums
  const statusText =
    typeof report.status === "string" ? report.status : String(report.status);

  return (
    <div
      data-report-id={report.id}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        padding: "1rem",
        borderBottom: "1px solid #f0f0f0",
        transition: "all 0.2s ease",
        background: isSelected ? "rgba(200, 110, 98, 0.05)" : "white",
        borderLeft: isSelected
          ? "3px solid var(--primary)"
          : "3px solid transparent",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 160,
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        <img
          src={
            report.photos && report.photos.length > 0 && report.photos[0].url
              ? report.photos[0].url
              : "https://via.placeholder.com/800x600?text=No+Image"
          }
          alt={report.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h6
          className="mb-1"
          style={{
            color: "var(--text)",
            fontWeight: 700,
            fontSize: "1rem",
            margin: 0,
            wordBreak: "break-word",
          }}
        >
          {report.title}
        </h6>

        {/* Three-line metadata: Type, Status, Date */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <small
            style={{
              color: "#2563eb",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              wordBreak: "break-word",
            }}
          >
            {report.category}
          </small>
          <div>
            <Badge
              bg=""
              style={{
                backgroundColor: statusVariant(statusText),
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {statusText}
            </Badge>
          </div>
          <small style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
            {report.createdAt
              ? new Date(report.createdAt).toLocaleDateString()
              : ""}
          </small>
        </div>

        <p
          style={{
            margin: "0.35rem 0 0",
            color: "#6b7280",
            fontSize: "0.9rem",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {report.description}
        </p>

        {statusText === "REJECTED" && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem",
              background: "#fff1f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
            }}
          >
            <div
              style={{ fontSize: "0.8rem", fontWeight: 700, color: "#b91c1c" }}
            >
              Rejection reason
            </div>
            <div
              style={{
                marginTop: "0.25rem",
                color: "#7f1d1d",
                fontSize: "0.9rem",
              }}
            >
              {(report as any).rejectedReason ||
                ((report as any).messages && (report as any).messages.length > 0
                  ? (report as any).messages[
                      (report as any).messages.length - 1
                    ].content
                  : "No reason provided")}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
            color: "#9ca3af",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <i className="bi bi-geo-alt" style={{ marginRight: "0.25rem" }} aria-hidden></i>
            <span style={{ fontFamily: "monospace" }}>
              {report.address}
            </span>
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onOpenDetails === "function") onOpenDetails(report.id);
            }}
            className="btn btn-outline-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
