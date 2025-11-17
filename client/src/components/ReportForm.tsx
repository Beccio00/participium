import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Container, Row, Col, Alert, Form, Card } from "react-bootstrap";
import { GeoAlt, FileText, Tag, Eye } from "react-bootstrap-icons";
import MapView from "./MapView";
import type { ReportCategory, ReportPhoto } from "../../../shared/ReportTypes";
import { createReport } from "../api/api";

export default function ReportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ReportCategory | "",
    latitude: 0,
    longitude: 0,
    isAnonymous: false,
    photos: [] as ReportPhoto[]
  });
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
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

    try{
      const reportData ={
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isAnonymous: formData.isAnonymous,
        photos: formData.photos,
        category: formData.category,
      }
      await createReport(reportData);
      navigate("/");
    }catch(err: any){
      console.error("Error submitting report:", err);
      setError(
        err?.message || "An error occurred while submitting the report."
      );
    }
  };

  const formCardStyle = {
    background: 'var(--surface)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(34, 49, 63, 0.06)',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: 'var(--primary)',
    color: 'white',
    padding: '2rem',
    textAlign: 'center' as const,
  };

  const sectionTitleStyle = {
    color: 'var(--text)',
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderLeft: '4px solid var(--primary)',
    paddingLeft: '0.5rem',
  };

  const coordinatesStyle = {
    background: 'linear-gradient(135deg, var(--stone) 0%, var(--olive) 100%)',
    borderRadius: '10px',
    padding: '1rem',
    margin: '1rem 0',
    color: 'white',
    textAlign: 'center' as const,
  };

  const mapContainerStyle = {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '3px solid var(--primary)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 0', paddingTop: '100px' }}>
      <Container>
        <Card style={formCardStyle}>
          <Card.Header style={headerStyle}>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
              <FileText /> Create New Report
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
              Report an issue in your municipality
            </p>
          </Card.Header>

          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSubmit}>
              <Row>
                {/* Report Details Section  TODO: uncomment this part for Report datails*/}
                
                {/*
                <Col lg={6}>
                  <div className="mb-4">
                    <h3 style={sectionTitleStyle}>
                      <Tag /> Report Details
                    </h3>
                    
                    {error && (
                      <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                      </Alert>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Brief title for your report"
                        required
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #e1e5e9',
                          padding: '0.75rem 1rem',
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the issue in detail..."
                        required
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #e1e5e9',
                          padding: '0.75rem 1rem',
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #e1e5e9',
                          padding: '0.75rem 1rem',
                        }}
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
                      </Form.Select>
                    </Form.Group>

                    <Form.Check
                      type="checkbox"
                      id="anonymous"
                      name="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={handleInputChange}
                      label={
                        <span>
                          <Eye /> Submit anonymously
                        </span>
                      }
                      className="p-3"
                      style={{
                        background: 'var(--bg)',
                        borderRadius: '10px',
                        border: '2px solid #e1e5e9',
                      }}
                    />
                  </div>
                </Col>
                */}

                {/* Location Section */}
                <Col lg={12}>
                  <div className="mb-4">
                    <h3 style={sectionTitleStyle}>
                      <GeoAlt /> Location Selection
                    </h3>
                    <p className="text-muted text-center mb-4">
                      Click on the map to select the exact location of the issue.
                    </p>

                    <div style={{ height: '600px', ...mapContainerStyle }}>
                      <MapView
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                      />
                    </div>

                    {selectedLocation && (
                      <div style={coordinatesStyle}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                          Selected Location
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            fontFamily: '"Courier New", monospace',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                          }}>
                            <GeoAlt /> {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Submit Button Section */}
              {/* TODO: Uncomment this when you want add a submit report button*/}
              {/* 
              <div className="text-center mt-4">
                <Button
                  type="submit"
                  disabled={!selectedLocation}
                  size="lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--stone) 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '1rem 3rem',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 8px 25px rgba(200, 110, 98, 0.3)',
                  }}
                >
                  Submit Report
                </Button>
              </div>
              */}
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
