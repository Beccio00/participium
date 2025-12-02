import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Container,
  Row,
  Col,
  Alert,
  Form,
  Card,
} from "react-bootstrap";
import { GeoAlt, FileText, Tag, Camera, X } from "react-bootstrap-icons";
import MapView from "./MapView";
// Marker stile Google Maps puntatore, usato per la location selezionata
import L from "leaflet";

const createColoredIcon = () => {
  const svg = `
    <svg width="38" height="54" viewBox="0 0 38 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#shadow)">
        <path d="M19 2C9.6 2 2 9.6 2 19.1c0 10.2 15.1 32.7 16.1 34.2.5.7 1.3.7 1.8 0C20.9 51.8 36 29.3 36 19.1 36 9.6 28.4 2 19 2z" fill="#C86E62" stroke="white" stroke-width="3"/>
        <circle cx="19" cy="19" r="7" fill="white"/>
      </g>
      <defs>
        <filter id="shadow" x="0" y="0" width="38" height="54" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
    </svg>
  `;
  return L.divIcon({
    className: "custom-marker",
    html: svg,
    iconSize: [38, 54],
    iconAnchor: [19, 54],
  });
};
import type { ReportCategory, ReportPhoto } from "../../../shared/ReportTypes";
import { createReport } from "../api/api";
import {
  formCardStyle,
  headerStyle,
  sectionTitleStyle,
  coordinatesStyle,
  mapContainerStyle,
  alertOverlayStyle,
  photoPreviewStyle,
  dndStyle,
  formControlStyle,
  photoCounterStyle,
  photoProgressStyle,
  photoLabelStyle,
  divStyle,
  h2Style,
  pStyle,
  cameraStyle,
  imgStyle,
  removeButtonStyle,
  h4Style,
  locationDivStyle,
  mapDivStyle,
  submitButtonStyle,
} from "../styles/ReportFormStyles";

export default function ReportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ReportCategory | "",
    latitude: 0,
    longitude: 0,
    isAnonymous: false,
    photos: [] as ReportPhoto[],
  });
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<number | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  const processFiles = (newFiles: File[]) => {
    //validation on dnd
    const validateImages = newFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (validateImages.length < newFiles.length) {
      setError("Only image files are allowed.");
    }
    if (validateImages.length === 0) return;

    const totalFiles = [...files, ...validateImages];

    if (totalFiles.length > 3) {
      setError("You can upload a maximum of 3 photos.");
      setFiles(totalFiles.slice(0, 3));
    } else {
      setFiles(totalFiles);

      if (validateImages.length === newFiles.length) {
        setError(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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

    const missingFields = [];
    if (!formData.title.trim()) missingFields.push("Title");
    if (!formData.description.trim()) missingFields.push("Description");
    if (!formData.category) missingFields.push("Category");
    if (files.length === 0) missingFields.push("Photos (min 1 max 3)");
    if (!selectedLocation) missingFields.push("Location");

    if (missingFields.length > 0) {
      setError(
        `Please fill in the following fields: ${missingFields.join(", ")}.`
      );
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setError(null);

    try {
      const dataToSend = new FormData();
      dataToSend.append("title", formData.title);
      dataToSend.append("description", formData.description);
      dataToSend.append("category", formData.category);
      dataToSend.append("latitude", formData.latitude.toString());
      dataToSend.append("longitude", formData.longitude.toString());
      dataToSend.append("isAnonymous", formData.isAnonymous.toString());
      files.forEach((file) => {
        dataToSend.append("photos", file);
      });
      await createReport(dataToSend);
      navigate("/");
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(
        err?.message || "An error occurred while submitting the report."
      );
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div style={divStyle} ref={topRef}>
      <Container>
        <Card style={formCardStyle}>
          <Card.Header style={headerStyle}>
            <h2 style={h2Style}>
              <FileText /> Create New Report
            </h2>
            <p style={pStyle}>Report an issue in your municipality</p>
          </Card.Header>

          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSubmit} noValidate>
              <Row className="justify-content-center">
                <Col lg={8}>
                  <div className="mb-4">
                    <h3 style={sectionTitleStyle}>
                      <Tag /> Report Details
                    </h3>

                    {error && (
                      <Alert
                        style={alertOverlayStyle}
                        variant="danger"
                        dismissible
                        onClose={() => setError(null)}
                      >
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
                          ...formControlStyle,
                          boxShadow:
                            focusedInput === "title"
                              ? "0 6px 18px rgba(27,83,175,0.08)"
                              : undefined,
                          transform:
                            focusedInput === "title"
                              ? "translateY(-1px)"
                              : undefined,
                        }}
                        onFocus={() => setFocusedInput("title")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the issue in detail..."
                        required
                        style={{
                          ...formControlStyle,
                          boxShadow:
                            focusedInput === "description"
                              ? "0 6px 18px rgba(27,83,175,0.08)"
                              : undefined,
                          transform:
                            focusedInput === "description"
                              ? "translateY(-1px)"
                              : undefined,
                        }}
                        onFocus={() => setFocusedInput("description")}
                        onBlur={() => setFocusedInput(null)}
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
                          ...formControlStyle,
                          boxShadow:
                            focusedInput === "category"
                              ? "0 6px 18px rgba(27,83,175,0.08)"
                              : undefined,
                          transform:
                            focusedInput === "category"
                              ? "translateY(-1px)"
                              : undefined,
                        }}
                        onFocus={() => setFocusedInput("category")}
                        onBlur={() => setFocusedInput(null)}
                      >
                        <option value="">Select a category</option>
                        {[
                          "WATER_SUPPLY_DRINKING_WATER",
                          "ARCHITECTURAL_BARRIERS",
                          "SEWER_SYSTEM",
                          "PUBLIC_LIGHTING",
                          "WASTE",
                          "ROAD_SIGNS_TRAFFIC_LIGHTS",
                          "ROADS_URBAN_FURNISHINGS",
                          "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
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
                    <Form.Group className="mb-4 mt-4">
                      <Form.Label className="fw-semibold">
                        Foto (Min 1, Max 3)
                      </Form.Label>

                      {/*D&D*/}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={dndStyle(isDragging)}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                          accept="image/*"
                          multiple
                        />
                        <Camera size={32} style={cameraStyle} />
                        <p className="mb-0 text-muted">
                          <strong>Click here to upload</strong> or drag photos
                          here
                        </p>
                        <small className="text-muted">
                          JPG, PNG (Max 3 foto)
                        </small>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "0.5rem",
                        }}
                      >
                        <div style={photoLabelStyle}>
                          {files.length} / 3 foto
                        </div>
                        <div style={photoCounterStyle} aria-hidden>
                          <div
                            style={{
                              ...photoProgressStyle,
                              width: `${(files.length / 3) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Photo preview */}
                      {files.length > 0 && (
                        <div className="d-flex flex-wrap gap-3 mt-3">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              style={{
                                ...photoPreviewStyle,
                                transform:
                                  hoverPreview === index
                                    ? "translateY(-4px) scale(1.03)"
                                    : undefined,
                                boxShadow:
                                  hoverPreview === index
                                    ? "0 10px 24px rgba(34,49,63,0.08)"
                                    : photoPreviewStyle.boxShadow,
                              }}
                              onMouseEnter={() => setHoverPreview(index)}
                              onMouseLeave={() => setHoverPreview(null)}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`preview-${index}`}
                                style={imgStyle}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                                style={removeButtonStyle}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Form.Group>

                    {/* <Form.Check
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
                    />*/}
                  </div>
                </Col>

                {/* Location Section */}
                <Col lg={8}>
                  <div className="mb-4 mt-4">
                    <h3 style={sectionTitleStyle}>
                      <GeoAlt /> Location Selection
                    </h3>
                    <p className="text-muted text-center mb-4">
                      Click on the map to select the exact location of the
                      issue.
                    </p>

                    <div
                      style={{
                        height: "clamp(400px, 60vh, 600px)",
                        ...mapContainerStyle,
                        position: "relative",
                      }}
                    >
                      {/* MapView con marker custom */}
                      <MapView
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                        // Passo una prop customIcon per il marker selezionato
                        customSelectedIcon={createColoredIcon()}
                      />
                    </div>

                    {selectedLocation && (
                      <div style={coordinatesStyle}>
                        <h4 style={h4Style}>Selected Location</h4>
                        <div style={locationDivStyle}>
                          <div style={mapDivStyle}>
                            <GeoAlt /> {selectedLocation[0].toFixed(6)},{" "}
                            {selectedLocation[1].toFixed(6)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              {/* Submit Button Section */}
              <div className="text-center mt-4">
                <Button type="submit" size="lg" style={submitButtonStyle}>
                  Send Report
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
