import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Report } from "../types/report.types";
import "../styles/MapView.css";

// Torino coordinates fallback
const TURIN: [number, number] = [45.0703, 7.6869];

// Helper function to get status color for map markers
// COMMENTED OUT: Not used since reports markers are disabled
/*
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "resolved":
      return "#28a745";
    case "in progress":
      return "#ffc107";
    case "assigned":
      return "#007bff";
    default:
      return "#6c757d";
  }
};
*/

// Helper function to create colored marker icon
// COMMENTED OUT: Not used since reports markers are disabled
/*
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};
*/

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
}

export default function MapView({
  onLocationSelect,
  selectedLocation,
  reports = [],
  selectedReportId,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const [center, setCenter] = useState<[number, number]>(TURIN);
  const [hasTileError, setHasTileError] = useState(false);
  const [turinData, setTurinData] = useState<any | null>(null);
  const [showBoundaryAlert, setShowBoundaryAlert] = useState(false);

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

    const maskLayer =L.geoJSON(maskGeoJSON, {
      style: {
        fillColor: "#000",
        fillOpacity: 0.35,
        stroke: false,
        interactive: true,
      },
    }).addTo(map);

    maskLayer.on("click", (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if (onLocationSelect){
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
        markerRef.current = L.marker([lat, lng],{
          icon: createSelectedLocationIcon(),
        }).addTo(map);
        onLocationSelect(lat, lng);
      });
    }
    turinLayer.addTo(map);

    // Add initial marker if selectedLocation is provided
    if (selectedLocation) {
      markerRef.current = L.marker(selectedLocation, {
        icon: createSelectedLocationIcon(),
      }).addTo(map);
    }

    // Add markers for reports
    // COMMENTED OUT: Reports markers are not displayed on the map for now
    // To re-enable, uncomment the following block
    /*
    reports.forEach((report) => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: createColoredIcon(getStatusColor(report.status)),
      }).addTo(map).bindPopup(`
          <div class="report-popup">
            <div class="report-popup-header">${report.title}</div>
            <div class="report-popup-body">
              <div class="report-popup-location">${report.latitude.toFixed(
                6
              )}, ${report.longitude.toFixed(6)}</div>
              <div class="report-popup-description">${report.description}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${
                  report.category
                }</span>
                <span style="color: ${getStatusColor(
                  report.status
                )}; font-weight: bold; font-size: 12px;">${report.status}</span>
              </div>
            </div>
          </div>
        `);
      reportMarkersRef.current.push(marker);
    });
    */

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
  // COMMENTED OUT: Reports markers update is disabled
  // To re-enable, uncomment the following useEffect
  /*
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing report markers
    reportMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    reportMarkersRef.current = [];

    // Add new report markers
    reports.forEach((report) => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: createColoredIcon(getStatusColor(report.status)),
      }).addTo(mapInstanceRef.current!).bindPopup(`
          <div class="report-popup">
            <div class="report-popup-header">${report.title}</div>
            <div class="report-popup-body">
              <div class="report-popup-location">${report.latitude.toFixed(
                6
              )}, ${report.longitude.toFixed(6)}</div>
              <div class="report-popup-description">${report.description}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${
                  report.category
                }</span>
                <span style="color: ${getStatusColor(
                  report.status
                )}; font-weight: bold; font-size: 12px;">${report.status}</span>
              </div>
            </div>
          </div>
        `);
      reportMarkersRef.current.push(marker);
    });
  }, [reports]);
  */

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
        icon: createSelectedLocationIcon(),
      }).addTo(mapInstanceRef.current);
    }
  }, [selectedLocation]);

  // Handle selected report popup
  // COMMENTED OUT: Selected report popup handling is disabled since reports markers are not shown
  // To re-enable, uncomment the following useEffect
  /*
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedReportId) return;

    // Find the marker for the selected report
    const reportIndex = reports.findIndex(
      (report) => report.id === selectedReportId
    );
    if (reportIndex !== -1 && reportMarkersRef.current[reportIndex]) {
      const marker = reportMarkersRef.current[reportIndex];
      const report = reports[reportIndex];

      // Center map on the marker
      mapInstanceRef.current.setView([report.latitude, report.longitude], 15);

      // Open the popup
      marker.openPopup();
    }
  }, [selectedReportId, reports]);
  */

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
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
            opacity: 0.95
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
      </div>
  );
}