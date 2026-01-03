import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { HouseDoor as Home, ArrowLeft as ArrowLeft } from "react-bootstrap-icons";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ 
        height: "100%",
        width: "100%",
        padding: "2rem",
        overflow: "hidden"
      }}
    >
      <div className="text-center" style={{ maxWidth: "600px", width: "100%" }}>
        <h1 style={{ 
          fontSize: "clamp(3rem, 12vw, 7rem)", 
          fontWeight: "500", 
          color: "#cd5c5c",
          lineHeight: "1",
          marginBottom: "1rem"
        }}>
          404
        </h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="d-flex align-items-center gap-2"
          >
            <Home size={18} />
            Go Home
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
