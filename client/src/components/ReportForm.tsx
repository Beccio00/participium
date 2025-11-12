import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Container, Row, Col, Alert } from "react-bootstrap";
import { GeoAlt, FileText, Tag, Eye } from "react-bootstrap-icons";
import MapView from "./MapView";
import type { ReportCategory } from "../../../shared/ReportTypes";
import "../styles/ReportForm.css";

export default function ReportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ReportCategory | "",
    latitude: 0,
    longitude: 0,
    isAnonymous: false,
  });
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    // Generate mock address based on coordinates (deterministic)
    const torinoStreets = [
      "Via Roma",
      "Via Garibaldi",
      "Via Po",
      "Corso Vittorio Emanuele II",
      "Via Pietro Micca",
      "Via Lagrange",
      "Via Nizza",
      "Via Cernaia",
      "Via San Secondo",
      "Via della Rocca",
      "Via XX Settembre",
      "Via Madama Cristina",
      "Corso Francia",
      "Via Sacchi",
      "Via Verdi",
      "Via Rossini",
      "Piazza Castello",
      "Piazza San Carlo",
      "Via Monte di Pietà",
      "Via Dora Grossa",
      "Corso Regina Margherita",
      "Via Principe Amedeo",
      "Via Carlo Alberto",
      "Via Sant'Ottavio",
      "Via della Misericordia",
      "Via Stampatori",
    ];

    // Use coordinates to deterministically select a street
    const streetIndex =
      Math.abs(Math.floor((lat + lng) * 100)) % torinoStreets.length;
    const selectedStreet = torinoStreets[streetIndex];
    const streetNumber = Math.floor(Math.abs(lat * 100) % 200) + 1;
    const mockAddress = `${selectedStreet} ${streetNumber}, 10100 Torino TO, Italy`;

    setSelectedAddress(mockAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("Please select a location on the map.");
      return;
    }
    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    setError(null);

    // Simulate API call
    setTimeout(() => {
      console.log("Report submitted:", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isAnonymous: formData.isAnonymous,
      });
      alert("Report submitted successfully! (This is a mock)");
      navigate("/");
    }, 1000);
  };

  return (
    <div className="report-form-container">
      <Container>
        <div className="report-form-card">
          <div className="report-form-header">
            <h2>
              <FileText /> Create New Report
            </h2>
            <p>Report an issue in your municipality</p>
          </div>

          <div className="report-form-body">
            <Row>
              <Col lg={6}>
                <div className="form-section">
                  <h3>
                    <Tag /> Report Details
                  </h3>
                  {error && (
                    <Alert
                      variant="danger"
                      className="alert-custom alert-danger-custom"
                    >
                      {error}
                    </Alert>
                  )}

                  <div className="form-group-custom">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief title for your report"
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Description</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the issue in detail..."
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Category</label>
                    <select
                      className="form-select form-select-custom"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a category</option>
                      {[
                        "WATER_SUPPLY_DRINKING_WATER",
                        "ARCHITECTURAL_BARRIERS",
                        "SEWER_SYSTEM",
                        "PUBLIC_LIGHTING",
                        "WASTE",
                        "ROAD_MAINTENANCE",
                        "GREEN_AREAS",
                        "PUBLIC_TRANSPORT",
                        "OTHER",
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="checkbox-custom">
                    <input
                      type="checkbox"
                      id="anonymous"
                      name="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="anonymous">
                      <Eye /> Submit anonymously
                    </label>
                  </div>
                </div>
              </Col>

              <Col lg={6}>
                <div className="form-section">
                  <h3>
                    <GeoAlt /> Location Selection
                  </h3>
                  <p>
                    Click on the map to select the exact location of the issue.
                  </p>

                  <div className="map-section-custom">
                    <div className="map-container-custom">
                      <MapView
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                      />
                    </div>
                  </div>

                  {selectedLocation && (
                    <div className="coordinates-row">
                      <h4>Selected Location</h4>
                      <div className="coordinates-display">
                        <div className="coordinates-text">
                          <GeoAlt /> {selectedLocation[0].toFixed(6)},{" "}
                          {selectedLocation[1].toFixed(6)}
                        </div>
                        <div className="address-text">📍 {selectedAddress}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <div className="submit-section">
              <Button
                type="submit"
                className="btn-submit-custom"
                disabled={!selectedLocation}
                onClick={handleSubmit}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
