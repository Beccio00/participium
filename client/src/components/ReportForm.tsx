import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Container,
  Row,
  Col,
  Alert,
  Form,
} from "react-bootstrap";
import {
  GeoAlt,
  FileText,
  Tag,
  Camera,
  X,
  Map as MapIcon,
  ExclamationCircleFill,
} from "react-bootstrap-icons";
import MapView from "./MapView";
import L from "leaflet"; // Used for custom marker icon

// Create a custom colored marker icon for the selected location
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
import { useAuth } from "../hooks/useAuth";
import { userHasRole } from "../utils/roles";
import { Role } from "../../../shared/RoleTypes";
import AccessRestricted from "./AccessRestricted";
import {
  sectionTitleStyle,
  coordinatesStyle,
  mapContainerStyle,
  photoPreviewStyle,
  dndStyle,
  formControlStyle,
  photoCounterStyle,
  photoProgressStyle,
  photoLabelStyle,
  divStyle,
  cameraStyle,
  imgStyle,
  removeButtonStyle,
  h4Style,
  locationDivStyle,
  mapDivStyle,
  submitButtonStyle,
} from "../styles/ReportFormStyles";
import { fetchAddressFromCoordinates } from "../utils/address";

export default function ReportForm() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // State for all form fields
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ReportCategory | "",
    latitude: 0,
    longitude: 0,
    isAnonymous: false,
    photos: [] as ReportPhoto[],
  });
  // State for selected location on the map
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  // State for uploaded files (photos)
  const [files, setFiles] = useState<File[]>([]);
  // Ref for file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  // State for drag-and-drop UI
  const [isDragging, setIsDragging] = useState(false);
  // State for which input is focused (for styling)
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // State for which photo is hovered (for preview effect)
  const [hoverPreview, setHoverPreview] = useState<number | null>(null);
  // State for resolved address from coordinates
  const [address, setAddress] = useState<string | null>(null);
  // State for address loading indicator
  const [loadingAddress, setLoadingAddress] = useState(false);
  // Ref to scroll to top on error
  const topRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
    photos?: string;
    location?: string;
  }>({});
  const [touched, setTouched] = useState<{
    title?: boolean;
    description?: boolean;
    category?: boolean;
    photos?: boolean;
    location?: boolean;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);


  const processFiles = (newFiles: File[]) => {
    // Only allow image files
    const validateImages = newFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (validateImages.length === 0) return;

    const totalFiles = [...files, ...validateImages];

    if (totalFiles.length > 3) {
      setFiles(totalFiles.slice(0, 3));
    } else {
      setFiles(totalFiles);
      // Clear photo error when files are added
      if (totalFiles.length > 0) {
        setFieldErrors((prev) => ({ ...prev, photos: undefined }));
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  // Drag-and-drop handlers for photo upload
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

  // Remove a photo from the list
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Handle changes for all form fields (text, textarea, select, checkbox)
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
      // Clear error when user starts typing (except for description min length)
      if (name === 'description') {
        if (value.trim().length < 10) {
          setFieldErrors((prev) => ({
            ...prev,
            description: value.trim() ? 'Description is too short. Please provide at least 10 characters' : undefined,
          }));
        } else {
          setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
      } else if (value.trim()) {
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const validateField = (fieldName: string) => {
    const errors: typeof fieldErrors = {};
    
    switch (fieldName) {
      case 'title':
        if (!formData.title.trim()) {
          errors.title = 'The title is required';
        }
        break;
      case 'description':
        if (!formData.description.trim()) {
          errors.description = 'The description is required';
        } else if (formData.description.trim().length < 10) {
          errors.description = 'Description is too short. Please provide at least 10 characters';
        }
        break;
      case 'category':
        if (!formData.category) {
          errors.category = 'Please select a category';
        }
        break;
    }
    
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setLoadingAddress(true);
    const fetchedAddress = await fetchAddressFromCoordinates(lat, lng);
    setAddress(fetchedAddress);
    setLoadingAddress(false);
    // Clear location error when location is selected
    setFieldErrors((prev) => ({ ...prev, location: undefined }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      category: true,
      photos: true,
      location: true,
    });

    const errors: typeof fieldErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = "The title is required";
    }
    if (!formData.description.trim()) {
      errors.description = "The description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description is too short. Please provide at least 10 characters";
    }
    if (!formData.category) {
      errors.category = "Please select a category";
    }
    if (files.length === 0) {
      errors.photos = "Upload at least 1 photo (max 3)";
    }
    if (!selectedLocation) {
      errors.location = "Click on the map to select a location";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setFieldErrors({});
    setServerError(null);

    try {
      // Prepare form data for API
      const dataToSend = new FormData();
      dataToSend.append("title", formData.title);
      dataToSend.append("description", formData.description);
      dataToSend.append("category", formData.category);
      dataToSend.append("latitude", formData.latitude.toString());
      dataToSend.append("longitude", formData.longitude.toString());
      // send isAnonymous as boolean (true/false)
      dataToSend.append("isAnonymous", String(formData.isAnonymous));
      // address remains unchanged (string)
      dataToSend.append("address", typeof address === "string" ? address : "");
      files.forEach((file) => {
        dataToSend.append("photos", file);
      });
      await createReport(dataToSend);
      navigate("/");
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setServerError(
        err?.message || "An error occurred while submitting the report. Please try again."
      );
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };



  // Se l'utente non è autenticato o non è un cittadino, mostra messaggio
  if (!isAuthenticated || (user && !userHasRole(user, Role.CITIZEN))) {
    const message = !isAuthenticated
      ? "You need to be logged in as a citizen to create a report."
      : "Only citizens can create reports.";
    
    return <AccessRestricted message={message} showLoginButton={!isAuthenticated} />;
  }

  return (
    <div style={divStyle} ref={topRef}>
      <Container className="py-4">
        <div className="text-center mb-4">
          <h2 style={{ color: "var(--text)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <FileText /> Create New Report
          </h2>
          <p className="text-muted">Report an issue in your municipality</p>
        </div>

        <Form onSubmit={handleSubmit} noValidate>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="mb-4">

                {serverError && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setServerError(null)}
                        className="mb-5"
                      >
                        <Alert.Heading style={{ fontSize: "1rem", fontWeight: 600 }}>
                          <ExclamationCircleFill className="me-2" />
                          Error
                        </Alert.Heading>
                        {serverError}
                      </Alert>
                    )}

                    <h3 style={sectionTitleStyle}>
                      <Tag /> Report Details
                    </h3>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('title')}
                        placeholder="Brief title for your report"
                        required
                        isInvalid={touched.title && !!fieldErrors.title}
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
                          borderColor: touched.title && fieldErrors.title ? "#dc3545" : undefined,
                        }}
                        onFocus={() => setFocusedInput("title")}
                      />
                      {touched.title && fieldErrors.title && (
                        <Form.Control.Feedback type="invalid" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExclamationCircleFill size={14} /> {fieldErrors.title}
                        </Form.Control.Feedback>
                      )}
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
                        onBlur={() => handleBlur('description')}
                        placeholder="Describe the issue in detail..."
                        required
                        isInvalid={touched.description && !!fieldErrors.description}
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
                          borderColor: touched.description && fieldErrors.description ? "#dc3545" : undefined,
                        }}
                        onFocus={() => setFocusedInput("description")}
                      />
                      {touched.description && fieldErrors.description && (
                        <Form.Control.Feedback type="invalid" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExclamationCircleFill size={14} /> {fieldErrors.description}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('category')}
                        required
                        isInvalid={touched.category && !!fieldErrors.category}
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
                          borderColor: touched.category && fieldErrors.category ? "#dc3545" : undefined,
                        }}
                        onFocus={() => setFocusedInput("category")}
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
                      {touched.category && fieldErrors.category && (
                        <Form.Control.Feedback type="invalid" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExclamationCircleFill size={14} /> {fieldErrors.category}
                        </Form.Control.Feedback>
                      )}
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
                        style={{
                          ...dndStyle(isDragging),
                          borderColor: touched.photos && fieldErrors.photos ? "#dc3545" : dndStyle(isDragging).borderColor,
                        }}
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
                      {touched.photos && fieldErrors.photos && (
                        <div className="text-danger mt-2" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                          <ExclamationCircleFill size={14} /> {fieldErrors.photos}
                        </div>
                      )}
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

                    <Form.Group
                      className="mb-3 mt-3 p-3"
                      style={{
                        background: "var(--bg)",
                        borderRadius: "10px",
                        border: "2px solid #e1e5e9",
                      }}
                    >
                      <Form.Check
                        type="checkbox"
                        id="anonymous"
                        name="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={handleInputChange}
                        label={
                          <span>
                            Make this report anonymous
                            <br />
                            <small className="text-muted">
                              If selected, your name will not be publicly
                              visible in the report list.
                            </small>
                          </span>
                        }
                      />
                    </Form.Group>
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
                        borderColor: touched.location && fieldErrors.location ? "#dc3545" : mapContainerStyle.borderColor,
                        borderWidth: touched.location && fieldErrors.location ? "2px" : mapContainerStyle.borderWidth,
                      }}
                    >
                      {/* MapView con marker custom */}
                      <MapView
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                        // Pass a customIcon prop for the selected marker
                        customSelectedIcon={createColoredIcon()}
                      />
                    </div>
                    {touched.location && fieldErrors.location && (
                      <div className="text-danger mt-2" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                        <ExclamationCircleFill size={14} /> {fieldErrors.location}
                      </div>
                    )}

                    {selectedLocation && (
                      <div style={coordinatesStyle}>
                        <h4 style={h4Style}>Selected Location</h4>
                        <div style={locationDivStyle}>
                          {/*coordinates*/}
                          <div style={mapDivStyle}>
                            <GeoAlt /> {selectedLocation[0].toFixed(6)},{" "}
                            {selectedLocation[1].toFixed(6)}
                          </div>
                          {/*address*/}
                          <div style={mapDivStyle}>
                            {loadingAddress ? (
                              <span>Loading address...</span>
                            ) : (
                              <span>
                                <MapIcon /> {address || "No address available"}
                              </span>
                            )}
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
      </Container>
    </div>
  );
}
