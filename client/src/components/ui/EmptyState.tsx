import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 2rem",
        background: "var(--surface)",
        borderRadius: "0.75rem",
        border: "2px dashed #dee2e6",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          marginBottom: "1rem",
          opacity: 0.5,
          color: "#6c757d",
        }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: "1.1rem",
          margin: "0 0 0.5rem 0",
          color: "#6c757d",
          fontWeight: 500,
        }}
      >
        {title}
      </p>
      <small style={{ fontSize: "0.95rem", color: "#adb5bd" }}>
        {description}
      </small>
    </div>
  );
}
