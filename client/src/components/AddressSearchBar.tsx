import React, { useState, useCallback } from "react";
import { Search } from "react-bootstrap-icons";

interface AddressSearchBarProps {
  onSearch: (address: string, zoom: number) => void;
  loading?: boolean;
  onClear?: () => void;
  isClearVisible?: boolean;
  externalError?: string | null;
}

const ZOOM_LEVELS = [19, 16, 14, 12];
const ZOOM_LABELS: Record<number, string> = {
  19: "Street (~100m radius)",
  16: "Neighborhood (~500m radius)",
  14: "District (~2km radius)",
  12: "City area (~5km radius)",
};

function AddressSearchBar({
  onSearch,
  loading,
  onClear,
  isClearVisible,
  externalError,
}: AddressSearchBarProps) {
  const [address, setAddress] = useState("");
  const [zoom, setZoom] = useState(19);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 3) {
      setError("Insert at least 3 characters to search.");
      return;
    }
    setError(null);
    onSearch(address, zoom);
  }, [address, zoom, onSearch]);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  }, []);

  const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setZoom(Number(e.target.value));
  }, []);

  const handleClear = useCallback(() => {
    setAddress("");
    if (onClear) onClear();
  }, [onClear]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 0 0 0",
        width: "100%",
        padding: "0 1rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        <div style={{ 
          flex: "1 1 250px", 
          minWidth: 200,
          position: "relative",
          display: "flex",
          alignItems: "center"
        }}>
          <Search 
            style={{
              position: "absolute",
              left: "0.75rem",
              color: "#6c757d",
              pointerEvents: "none",
              fontSize: "1.1rem"
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search for an address"
            value={address}
            onChange={handleAddressChange}
            style={{
              width: "100%",
              fontSize: 15,
              padding: "0.5rem 0.75rem 0.5rem 2.5rem",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
            }}
            disabled={loading}
          />
        </div>
        <select
          className="form-select"
          value={zoom}
          onChange={handleZoomChange}
          style={{
            flex: "0 1 220px",
            minWidth: 180,
            fontSize: 14,
            padding: "0.5rem 0.5rem",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
          }}
          disabled={loading}
        >
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>
              {ZOOM_LABELS[z]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ 
            fontSize: 15, 
            padding: "0.5rem 1.5rem", 
            flex: "0 0 auto",
            whiteSpace: "nowrap",
            borderRadius: "6px",
            fontWeight: 500,
          }}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {isClearVisible && !!address && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="btn btn-secondary"
            style={{
              fontSize: 14,
              padding: "0.5rem 1rem",
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              borderRadius: "6px",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
        )}
      </form>
      {(error || externalError) && (
        <div style={{ 
          color: "#dc3545", 
          fontSize: 13, 
          marginTop: "0.5rem",
          padding: "0.5rem 0.75rem",
          background: "#f8d7da",
          borderRadius: "4px",
          border: "1px solid #f5c2c7"
        }}>
          {error || externalError}
        </div>
      )}
      <div style={{ 
        marginTop: 6, 
        marginBottom: "1.5rem",
        color: "#6c757d", 
        fontSize: 12,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}>
        <b>Area size:</b> The search area depends on the selected zoom level.
      </div>
    </div>
  );
}

export default React.memo(AddressSearchBar);
