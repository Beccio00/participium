import { useEffect, useRef, useState } from "react";
import { getReports } from "../api/api";
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Report } from "../types/report.types";
import "../styles/MapView.css";
import InfoModal from "./InfoModal";

// Torino coordinates fallback
const TURIN: [number, number] = [45.0703, 7.6869];

// Helper function to get status color for map markers
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "resolved":
      return "#28a745";
    case "in progress":
      return "#ffc107";
    case "assigned":
      return "#007bff";
    case "external_assigned":
      return "#8b5cf6"; // purple for external
    default:
      return "#6c757d";
  }
};

// Helper function to create colored marker icon
const createColoredIcon = (color: string) => {
  // marker svg
  const svg = `
    <svg width="38" height="54" viewBox="0 0 38 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#shadow)">
        <path d="M19 2C9.6 2 2 9.6 2 19.1c0 10.2 15.1 32.7 16.1 34.2.5.7 1.3.7 1.8 0C20.9 51.8 36 29.3 36 19.1 36 9.6 28.4 2 19 2z" fill="${color}" stroke="white" stroke-width="3"/>
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
    iconAnchor: [19, 54], //marker edge
  });
};

// Helper function to create selected location marker icon
const createSelectedLocationIcon = () => {
  return L.divIcon({
    className: "selected-location-marker",
    html: `<div style="
      background-color: var(--primary, #C86E62);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface MapViewProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
  reports?: Report[];
  selectedReportId?: number | null;
  customSelectedIcon?: L.DivIcon | null;
  onReportDetailsClick?: (reportId: number) => void;
  hideInfoButton?: boolean;
}

export default function MapView({
  onLocationSelect,
  selectedLocation,
  reports: initialReports = [],
  selectedReportId,
  customSelectedIcon,
  onReportDetailsClick,
  hideInfoButton = false,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const [center, setCenter] = useState<[number, number]>(TURIN);
  const [hasTileError, setHasTileError] = useState(false);
  const [turinData, setTurinData] = useState<any | null>(null);
  const [showBoundaryAlert, setShowBoundaryAlert] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [reports, setReports] = useState<Report[]>(initialReports);
  // Polling per aggiornare i report ogni 10 secondi
  useEffect(() => {
    let polling = true;
    const fetchReports = async () => {
      try {
        const data = await getReports();
        // Filtra solo i report non risolti
        setReports(data.filter((r) => r.status.toLowerCase() !== "resolved"));
      } catch (err) {
        // Puoi gestire errori qui se vuoi
      }
    };
    fetchReports();
    const interval = setInterval(() => {
      if (polling) fetchReports();
    }, 10000);
    return () => {
      polling = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetch("/turin-boundary3.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch GeoJSON");
        }
        return response.json();
      })
      .then((data) => {
        setTurinData(data);
      })
      .catch((err) => {
        console.error("Errore caricamento GeoJSON:", err);
      });
  }, []);

  // Always center on Turin
  useEffect(() => {
    setCenter(TURIN);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !turinData) return;

    const map = L.map(mapRef.current).setView(center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on("tileerror", () => {
      setHasTileError(true);
    });

    const worldRect = [
      [-90, -180],
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ];
    const turinHoles = (turinData as any).features[0].geometry.coordinates.map(
      (polygon: any) => polygon[0]
    );

    const maskGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [worldRect, ...turinHoles],
      },
      properties: {},
    };

    const maskLayer = L.geoJSON(maskGeoJSON, {
      style: {
        fillColor: "#000",
        fillOpacity: 0.35,
        stroke: false,
        interactive: true,
      },
    }).addTo(map);

    maskLayer.on("click", (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if (onLocationSelect) {
        setShowBoundaryAlert(true);

        setTimeout(() => {
          setShowBoundaryAlert(false);
        }, 3000);
      }
    });

    const turinLayer = L.geoJSON(turinData as any, {
      style: {
        color: "var(--primary, #C86E62)",
        weight: 2,
        fillOpacity: 0.05,
        fillColor: "var(--primary, #C86E62)",
        interactive: true,
      },
    });

    // Add click event to select location (only if callback is provided)
    if (onLocationSelect) {
      turinLayer.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);

        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng], {
          icon: customSelectedIcon || createSelectedLocationIcon(),
        }).addTo(map);
        onLocationSelect(lat, lng);
      });
    }
    turinLayer.addTo(map);

    // Add initial marker if selectedLocation is provided
    if (selectedLocation) {
      markerRef.current = L.marker(selectedLocation, {
        icon: customSelectedIcon || createSelectedLocationIcon(),
      }).addTo(map);
    }

    // Add markers for reports using MarkerClusterGroup
    /* const markerCluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60, // distanza in pixel per raggruppare
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster: any) {
        // Marker cluster icon: mostra il numero totale di report
        return L.divIcon({
          html: `<div style="background:#C86E62;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
          className: "custom-cluster-marker",
          iconSize: [32, 32],
        });
      },
    });

    reports.forEach((report: Report) => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: createColoredIcon(getStatusColor(report.status)),
      });
      // Popup HTML con pulsante View Details
      const popupContent = document.createElement("div");
      popupContent.className = "report-popup";
      popupContent.innerHTML = `
        <div class="report-popup-header">${report.title}</div>
        <div class="report-popup-body">
          <div class="report-popup-location">${report.address}</div>
          <div class="report-popup-description">${report.description}</div>
          <div style="margin-top: 0.5rem;">
            <div>
              <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; display: inline-block; max-width: 100%;">${
                report.category
              }</span>
            </div>
            <div style="margin-top: 6px;">
              <span class="report-status-pill" style="background:${getStatusColor(
                report.status
              )};">${report.status}</span>
            </div>
          </div>
          <div style="margin-top:0.5rem;font-size:12px;">Reported by: <b>${
            report.isAnonymous
              ? "anonymous"
              : report.user
              ? `${report.user.firstName} ${report.user.lastName}`
              : "user"
          }</b></div>
          <div style="margin-top:0.75rem;">
            <button class="btn btn-sm btn-primary mt-2 view-details-btn" style="width:100%;">View Details</button>
          </div>
        </div>
      `;
      // Attach handler to the embedded button
      const detailsBtn = popupContent.querySelector('.view-details-btn') as HTMLButtonElement | null;
      if (detailsBtn) {
        detailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onReportDetailsClick) onReportDetailsClick(report.id);
        });
      }
      marker.bindPopup(popupContent);
      reportMarkersRef.current.push(marker);
      markerCluster.addLayer(marker);
    });

    map.addLayer(markerCluster); */

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turinData]);

  // Update report markers when reports change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing report markers and clusters
    reportMarkersRef.current.forEach((marker: L.Marker) => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    reportMarkersRef.current = [];
    // Remove all marker clusters
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof (L as any).MarkerClusterGroup) {
        mapInstanceRef.current!.removeLayer(layer);
      }
    });

    // Add new report markers using MarkerClusterGroup
    const markerCluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster: any) {
        return L.divIcon({
          html: `<div style="background:#C86E62;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
          className: "custom-cluster-marker",
          iconSize: [32, 32],
        });
      },
    });

    reports.forEach((report: Report) => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: createColoredIcon(getStatusColor(report.status)),
      });
      // Popup HTML con pulsante View Details
      const popupContent = document.createElement("div");
      popupContent.className = "report-popup";
      popupContent.innerHTML = `
        <div class="report-popup-header">${report.title}</div>
        <div class="report-popup-body">
          <div class="report-popup-location">${report.address}</div>
          <div class="report-popup-description">${report.description}</div>
          <div style="margin-top: 0.5rem;">
            <div>
              <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; display: inline-block; max-width: 100%;">${
                report.category
              }</span>
            </div>
            <div style="margin-top: 6px;">
              <span class="report-status-pill" style="background:${getStatusColor(
                report.status
              )};">${report.status}</span>
            </div>
          </div>
          <div style="margin-top:0.5rem;font-size:12px;">Reported by: <b>${
            report.isAnonymous
              ? "anonymous"
              : report.user
              ? `${report.user.firstName} ${report.user.lastName}`
              : "user"
          }</b></div>
          <div style="margin-top:0.75rem;">
            <button class="btn btn-sm btn-primary mt-2 view-details-btn" style="width:100%;">View Details</button>
          </div>
        </div>
      `;
      // Attach handler to embedded button
      const detailsBtn = popupContent.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement | null;
      if (detailsBtn) {
        detailsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onReportDetailsClick) onReportDetailsClick(report.id);
        });
      }
      marker.bindPopup(popupContent);
      reportMarkersRef.current.push(marker);
      markerCluster.addLayer(marker);
    });

    mapInstanceRef.current.addLayer(markerCluster);
  }, [reports]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center);
    }
  }, [center]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (selectedLocation) {
      markerRef.current = L.marker(selectedLocation, {
        icon: customSelectedIcon || createSelectedLocationIcon(),
      }).addTo(mapInstanceRef.current);
    }
  }, [selectedLocation]);

  // Handle selected report popup
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedReportId) return;

    // Find the marker for the selected report
    const reportIndex = reports.findIndex(
      (report: Report) => report.id === selectedReportId
    );
    if (reportIndex !== -1 && reportMarkersRef.current[reportIndex]) {
      const marker = reportMarkersRef.current[reportIndex];
      const report = reports[reportIndex];

      // Trova il cluster che contiene il marker
      let markerClusterLayer: any = null;
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer && typeof layer.getVisibleParent === "function") {
          markerClusterLayer = layer;
        }
      });

      if (markerClusterLayer) {
        // Zooma sul marker e apri il popup dopo lo zoom
        markerClusterLayer.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      } else {
        // Fallback: centra e apri il popup normalmente
        mapInstanceRef.current.setView([report.latitude, report.longitude], 15);
        marker.openPopup();
      }
    }
  }, [selectedReportId, reports]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Info button in the top-right corner of the map */}
      {!hideInfoButton && (
        <button
          className="map-info-button"
          aria-label="Map information"
          onClick={(e) => {
            e.stopPropagation();
            setShowInfoModal(true);
          }}
        >
          i
        </button>
      )}
      {/*alert bootstrap cudtom*/}
      {showBoundaryAlert && (
        <div
          className="alert alert-warning shadow-sm"
          role="alert"
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "auto",
            minWidth: "300px",
            textAlign: "center",
            opacity: 0.95,
          }}
        >
          <strong>Warning!</strong> Please select a point within Turin.
          {/* Close button for manual dismissal (optional) */}
          <button
            type="button"
            className="btn-close float-end ms-2"
            aria-label="Close"
            onClick={() => setShowBoundaryAlert(false)}
          ></button>
        </div>
      )}
      {hasTileError && (
        <div style={{ padding: "1rem", color: "crimson" }}>
          Unable to load map tiles — showing coordinates only.
        </div>
      )}
      <div ref={mapRef} className="leaflet-map" />

      <InfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
}
