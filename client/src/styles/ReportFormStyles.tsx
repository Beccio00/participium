import type { CSSProperties } from "react";

export const formCardStyle: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(34, 49, 63, 0.06)",
  overflow: "hidden",
};

export const headerStyle: CSSProperties = {
  background: "var(--primary)",
  color: "white",
  padding: "2rem",
  textAlign: "center" as const,
};

export const sectionTitleStyle: CSSProperties = {
  color: "var(--text)",
  fontSize: "1.5rem",
  fontWeight: 600,
  marginBottom: "1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  borderLeft: "4px solid var(--primary)",
  paddingLeft: "0.5rem",
};

export const coordinatesStyle: CSSProperties = {
  background: "linear-gradient(135deg, var(--stone) 0%, var(--olive) 100%)",
  borderRadius: "10px",
  padding: "1rem",
  margin: "1rem 0",
  color: "white",
  textAlign: "center" as const,
};

export const mapContainerStyle: CSSProperties = {
  borderRadius: "10px",
  overflow: "hidden",
  border: "3px solid var(--primary)",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
};
export const alertOverlayStyle: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 9999,
  minWidth: "300px",
  maxWidth: "90%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  textAlign: "center",
};

export const photoPreviewStyle: CSSProperties = {
  position: "relative",
  width: "100px",
  height: "100px",
  borderRadius: "10px",
  overflow: "hidden",
  border: "1px solid #e1e5e9",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  transition: "transform 0.12s ease, box-shadow 0.12s ease",
};

export const dndStyle = (isDragging: boolean): CSSProperties => ({
  border: `2px dashed ${isDragging ? "var(--primary)" : "#e1e5e9"}`,
  borderRadius: "10px",
  padding: "2rem",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isDragging ? "rgba(200, 110, 98, 0.05)" : "var(--bg)",
  transition:
    "box-shadow 0.18s ease, border-color 0.12s ease, transform 0.12s ease",
  boxShadow: isDragging ? "0 8px 24px rgba(27,83,175,0.06)" : undefined,
});

export const formControlStyle: CSSProperties = {
  borderRadius: "10px",
  border: "2px solid #e1e5e9",
  padding: "0.75rem 1rem",
  transition:
    "box-shadow 0.12s ease, border-color 0.12s ease, transform 0.08s ease",
};

export const divStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  padding: "2rem 0",
  paddingTop: "100px",
};

export const h2Style: CSSProperties = {
  margin: 0,
  fontSize: "2.5rem",
  fontWeight: 700,
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
};

export const pStyle: CSSProperties = {
  margin: "0.5rem 0 0 0",
  opacity: 0.9,
  fontSize: "1.1rem",
};

export const cameraStyle: CSSProperties = {
  color: "var(--primary)",
  marginBottom: "10px",
};

export const imgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export const removeButtonStyle: CSSProperties = {
  position: "absolute",
  top: "4px",
  right: "4px",
  background: "rgba(255, 255, 255, 0.9)",
  border: "none",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#dc3545",
  padding: 0,
};

export const h4Style: CSSProperties = {
  margin: "0 0 0.5rem 0",
  fontSize: "1.1rem",
  fontWeight: 600,
};

export const locationDivStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  alignItems: "center",
};

export const mapDivStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "1rem",
  fontWeight: 600,
  fontFamily: '"Courier New", monospace',
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
};

export const submitButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, var(--primary) 0%, var(--stone) 100%)",
  border: "none",
  borderRadius: "50px",
  padding: "1rem 3rem",
  fontSize: "1.2rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1px",
  boxShadow: "0 8px 25px rgba(200, 110, 98, 0.3)",
  transition: "transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease",
};

export const photoCounterStyle: CSSProperties = {
  width: "90px",
  height: "8px",
  background: "rgba(34,49,63,0.04)",
  borderRadius: "999px",
  overflow: "hidden",
  marginLeft: "0.5rem",
};

export const photoProgressStyle: CSSProperties = {
  height: "100%",
  background:
    "linear-gradient(90deg, var(--navbar-accent), color-mix(in srgb, var(--navbar-accent) 80%, black 20%))",
  width: "0%",
  transition: "width 0.18s ease",
};

export const photoLabelStyle: CSSProperties = {
  fontSize: "0.85rem",
  color: "rgba(34,49,63,0.7)",
};
