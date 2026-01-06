import React, { useState } from "react";

interface AddressSearchBarProps {
  onSearch: (address: string, zoom: number) => void;
  loading?: boolean;
  onClear?: () => void;
  isClearVisible?: boolean;
}

const ZOOM_LEVELS = [19, 16, 14, 12];
const ZOOM_LABELS: Record<number, string> = {
  19: "Street (~100m radius)",
  16: "Neighborhood (~500m radius)",
  14: "District (~2km radius)",
  12: "City area (~5km radius)",
};

export default function AddressSearchBar({
  onSearch,
  loading,
  onClear,
  isClearVisible,
}: AddressSearchBarProps) {
  const [address, setAddress] = useState("");
  const [zoom, setZoom] = useState(16);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 3) {
      setError("Insert at least 3 characters to search.");
      return;
    }
    setError(null);
    onSearch(address, zoom);
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto 1.5rem auto",
        width: "100%",
        padding: "0 1rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search for an address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            flex: "1 1 200px",
            minWidth: 200,
            fontSize: 16,
            padding: "0.75rem 1rem",
          }}
          disabled={loading}
        />
        <select
          className="form-select"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{
            flex: "0 1 260px",
            minWidth: 200,
            fontSize: 15,
            padding: "0.6rem 0.5rem",
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
          style={{ fontSize: 16, padding: "0.7rem 1.5rem", flex: "0 0 auto" }}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {isClearVisible && !!address && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setAddress("");
              if (onClear) onClear();
            }}
            style={{
              marginLeft: 8,
              fontSize: 20,
              color: "#888",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
            tabIndex={0}
          >
            ×
          </button>
        )}
        {error && (
          <div style={{ color: "crimson", marginLeft: 8 }}>{error}</div>
        )}
      </form>
      <div style={{ marginTop: 8, color: "#555", fontSize: 14, maxWidth: 700 }}>
        <b>Area size:</b> The search area depends on the selected zoom level. A
        smaller radius means a more precise search area; a larger radius covers
        a wider region.
      </div>
    </div>
  );
}
