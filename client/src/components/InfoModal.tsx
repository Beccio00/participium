import { useEffect } from "react";
import "../styles/InfoModal.css";

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InfoModal({ open, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="map-info-modal"
      role="dialog"
      aria-modal="true"
      aria-label="About Participium"
      onClick={onClose}
    >
      <div className="map-info-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="map-info-modal-close"
          aria-label="Close info dialog"
          onClick={onClose}
        >
          ×
        </button>
        
        <div className="info-modal-header">
          <h3>Participium</h3>
          <p className="info-modal-subtitle">Report civic issues. Get them fixed.</p>
        </div>
        
        <div className="map-info-modal-body">
          <div className="info-section">
            <div className="info-item">
              <i className="bi bi-map" aria-hidden></i>
              <div className="info-text">
                <h5>Easy Reporting</h5>
                <p>Report problems like potholes, broken streetlights, waste, architectural barriers, and more. Simply select a location on the map, upload photos, and describe the issue.</p>
              </div>
            </div>
            
            <div className="info-item">
              <i className="bi bi-people" aria-hidden></i>
              <div className="info-text">
                <h5>Professional Review</h5>
                <p>Your report will be reviewed by municipal offices and assigned to the right technical team for prompt resolution.</p>
              </div>
            </div>
            
            <div className="info-item">
              <i className="bi bi-bell" aria-hidden></i>
              <div className="info-text">
                <h5>Stay Updated</h5>
                <p>Track the progress of your report from submission to resolution, receive notifications at every step, and browse reports from other citizens to stay informed about issues in your area.</p>
              </div>
            </div>
            
            <div className="info-cta">
              <p><strong>Help make Turin a better place to live.</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
