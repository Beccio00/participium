import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Torino coordinates fallback
const TURIN: [number, number] = [45.0703, 7.6869];

interface MapViewProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
}

export default function MapView({
  onLocationSelect,
  selectedLocation,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [center, setCenter] = useState<[number, number]>(TURIN);
  const [hasTileError, setHasTileError] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCenter(TURIN);
      return;
    }

    const success = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setCenter([latitude, longitude]);
    };

    const error = () => {
      setCenter(TURIN);
    };

    navigator.geolocation.getCurrentPosition(success, error, { timeout: 5000 });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on("tileerror", () => {
      setHasTileError(true);
    });

    // Add click event to select location
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([lat, lng]).addTo(map);
      onLocationSelect?.(lat, lng);
    });

    // Add initial marker if selectedLocation is provided
    if (selectedLocation) {
      markerRef.current = L.marker(selectedLocation).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      markerRef.current = L.marker(selectedLocation).addTo(
        mapInstanceRef.current
      );
    }
  }, [selectedLocation]);

  return (
    <>
      {hasTileError && (
        <div style={{ padding: "1rem", color: "crimson" }}>
          Unable to load map tiles — showing coordinates only.
        </div>
      )}
      <div ref={mapRef} className="leaflet-map" />
    </>
  );
}
