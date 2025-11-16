import { Badge } from 'react-bootstrap';
import type { Report } from "../../types";

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ReportCard({ report, isSelected = false, onClick }: ReportCardProps) {
  const statusVariant = report.status === "Resolved" ? "success" : report.status === "In Progress" ? "warning" : "info";

  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        padding: '1rem',
        borderBottom: '1px solid #f0f0f0',
        transition: 'all 0.2s ease',
        background: isSelected ? 'rgba(200, 110, 98, 0.05)' : 'white',
        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = isSelected ? 'rgba(200, 110, 98, 0.08)' : 'rgba(0, 0, 0, 0.02)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSelected ? 'rgba(200, 110, 98, 0.05)' : 'white';
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="mb-0" style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>
          {report.title}
        </h6>
        <Badge bg="" style={{
          backgroundColor: statusVariant === "success" ? "#10b981" : statusVariant === "warning" ? "#f59e0b" : "#3b82f6",
          fontSize: '0.7rem',
          fontWeight: 600,
          marginLeft: '0.5rem'
        }}>
          {report.status}
        </Badge>
      </div>
      <p className="mb-2" style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
        {report.description}
      </p>
      <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem', color: '#999' }}>
        <span>
          📍 {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
        </span>
        {report.createdAt && <span>{new Date(report.createdAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
