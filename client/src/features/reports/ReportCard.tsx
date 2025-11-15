import type { Report } from "../../types";
import "./ReportCard.css";

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ReportCard({ report, isSelected = false, onClick }: ReportCardProps) {
  const statusClass = report.status.toLowerCase().replace(" ", "-");

  return (
    <div className={`report-card ${isSelected ? "selected" : ""}`} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="report-card-header">
        <h4 className="report-card-title">{report.title}</h4>
        <span className={`report-status status-${statusClass}`}>{report.status}</span>
      </div>
      <p className="report-card-description">{report.description}</p>
      <div className="report-card-meta">
        <span className="report-location">
          {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
        </span>
        {report.createdAt && <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
