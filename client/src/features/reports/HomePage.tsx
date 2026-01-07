import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Clipboard, Pencil, List, FileEarmarkText, Search, FunnelFill } from "react-bootstrap-icons";
import { Offcanvas } from "react-bootstrap";

import { useAuth } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import ReportCard from "./ReportCard.tsx";
import MapView from "../../components/MapView";
import AddressSearchBar from "../../components/AddressSearchBar";
import InfoModal from "../../components/InfoModal";
import { geocodeAddress, getReportsByBbox } from "../../api/api";
import ReportDetailsModal from "./ReportDetailsModal";
import  EmptyState  from "../../components/ui/EmptyState.tsx";

import type { Report } from "../../types";
import { getReports as getReportsApi } from "../../api/api";

import { Role } from "../../../../shared/RoleTypes.ts";
import { ReportStatus } from "../../../../shared/ReportTypes.ts";
import "../../styles/HomePage.css";

// --- Helpers ---------------------------------------------------------------

function getRecentReports(reports: Report[]): Report[] {
  return [...reports]
    .sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10);
}

function isUserOwnReport(report: Report, isAuthenticated: boolean, user: any): boolean {
  return Boolean(isAuthenticated && user && report.user && user.email === report.user.email);
}

function saveSidebarScroll(sidebarScrollRef: React.MutableRefObject<number>) {
  const sidebar = document.querySelector(".reports-sidebar-scroll") as HTMLElement | null;
  if (sidebar) sidebarScrollRef.current = sidebar.scrollTop;
}

// Normalizza lat/long numerici (API può restituire stringhe)
function normalizeReports(data: any[]): Report[] {
  return (data || []).map((r: any) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

// --------------------------------------------------------------------------

export default function HomePage() {
  // Clear address search and restore all reports
  const handleClearAddressSearch = useCallback(async () => {
    // Reset search state
    setSearchCenter(null);
    setSearchZoom(13);
    setSearchError(null);
    setSearchAreaBbox(null);
    setSearchLoading(true);
    try {
      const data = await getReportsApi();
      const normalized = (data || []).map((r: any) => ({
        ...r,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
      }));
      setReports(normalized);
    } catch (err: any) {
      setReportsError(err?.message || String(err));
    } finally {
      setSearchLoading(false);
    }
  }, []);
  // Serach address and zoom
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(
    null
  );
  const [searchZoom, setSearchZoom] = useState<number>(16);
  const [searchAreaBbox, setSearchAreaBbox] = useState<
    [number, number, number, number] | null
  >(null);

  // Sidebar search and filter states
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");
  const [sidebarFilterStatus, setSidebarFilterStatus] = useState("");
  const [sidebarFilterCategory, setSidebarFilterCategory] = useState("");

  // Active filters (actually applied)
  const [sidebarActiveSearchTerm, setSidebarActiveSearchTerm] = useState("");
  const [sidebarActiveFilterStatus, setSidebarActiveFilterStatus] = useState("");
  const [sidebarActiveFilterCategory, setSidebarActiveFilterCategory] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Memoize sidebar handlers
  const handleSidebarSearchChange = useCallback((term: string) => {
    setSidebarSearchTerm(term);
  }, []);

  const handleSidebarStatusChange = useCallback((status: string) => {
    setSidebarFilterStatus(status);
  }, []);

  const handleSidebarCategoryChange = useCallback((category: string) => {
    setSidebarFilterCategory(category);
  }, []);

  // Handle search button click
  const handleSearchToggle = useCallback(() => {
    if (isSearchActive) {
      // Cancel - clear everything
      setSidebarActiveSearchTerm("");
      setSidebarActiveFilterStatus("");
      setSidebarActiveFilterCategory("");
      setSidebarSearchTerm("");
      setSidebarFilterStatus("");
      setSidebarFilterCategory("");
      setIsSearchActive(false);
    } else {
      // Apply search - copy current inputs to active filters
      setSidebarActiveSearchTerm(sidebarSearchTerm);
      setSidebarActiveFilterStatus(sidebarFilterStatus);
      setSidebarActiveFilterCategory(sidebarFilterCategory);
      setIsSearchActive(true);
    }
  }, [isSearchActive, sidebarSearchTerm, sidebarFilterStatus, sidebarFilterCategory]);

  // Address search handler
  const handleAddressSearch = useCallback(async (address: string, zoom: number) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const geo = await geocodeAddress(address, zoom);
      setSearchCenter([geo.latitude, geo.longitude]);
      setSearchZoom(geo.zoom);
      // Parse bbox string into array of numbers: "minLon,minLat,maxLon,maxLat"
      const bboxParts = geo.bbox.split(",").map(Number) as [
        number,
        number,
        number,
        number
      ];
      setSearchAreaBbox(bboxParts);
      // Load reports in the area
      const reportsInArea = await getReportsByBbox(geo.bbox);
      setReports(
        (reportsInArea || []).map((r: any) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }))
      );
    } catch (err: any) {
      // Custom error for out-of-Turin or geocoding errors
      if (
        err?.message?.toLowerCase().includes("not in turin") ||
        err?.message?.toLowerCase().includes("not in allowed area") ||
        err?.message?.toLowerCase().includes("geocoding error")
      ) {
        setSearchError(
          "Invalid address: please enter a location within Turin."
        );
      } else {
        setSearchError(err.message || "Error in address search.");
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReportsSidebar, setShowReportsSidebar] = useState(false);

  const sidebarScrollRef = useRef<number>(0);

  const [reports, setReports] = useState<Report[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // --- Roles (user.role è string[]) ---------------------------------------

  const roles: string[] = useMemo(() => {
    return Array.isArray(user?.role) ? user.role : [];
  }, [user?.role]);

  const hasRole = (role: Role | string) => roles.includes(String(role));

  const isCitizen = useMemo(() => isAuthenticated && hasRole(Role.CITIZEN), [isAuthenticated, roles]);
  const isPublicRelations = useMemo(
    () => isAuthenticated && hasRole(Role.PUBLIC_RELATIONS),
    [isAuthenticated, roles]
  );

  const isTechnicalOfficer = useMemo(() => {
    if (!isAuthenticated) return false;
    // "Tecnico" = qualsiasi ruolo che NON sia citizen/admin/public_relations
    const blocked = [String(Role.CITIZEN), String(Role.ADMINISTRATOR), String(Role.PUBLIC_RELATIONS)];
    return roles.length > 0 && !roles.some((r) => blocked.includes(r));
  }, [isAuthenticated, roles]);

  // --- Report handlers -----------------------------------------------------

  const handleReportUpdate = useCallback((updatedReport: Report) => {
    setReports((prev) => prev.map((r) => (r.id === updatedReport.id ? updatedReport : r)));
  }, []);

  const refreshReports = useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  const handleAddReport = useCallback(() => {
    navigate("/report/new");
  }, [navigate]);

  useEffect(() => {
    const handleRefresh = () => refreshReports();
    window.addEventListener("refreshReports", handleRefresh);
    return () => window.removeEventListener("refreshReports", handleRefresh);
  }, [refreshReports]);

  const handleReportDetailsClick = useCallback((reportId: number) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);

    // su mobile: chiudo la lista (offcanvas) e lascio la mappa visibile
    if (window.innerWidth < 992) setShowReportsSidebar(false);
  }, []);

  // Role checks using the utility functions for consistency
  // (Already defined above using useMemo for better performance)

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingReports(true);
      setReportsError(null);

      try {
        const data = await getReportsApi();
        if (!mounted) return;

        // visibilità: stati "approvati" + i pending dell'utente loggato
        const approvedStatuses = new Set<string>([
          String(ReportStatus.ASSIGNED),
          String(ReportStatus.EXTERNAL_ASSIGNED),
          String(ReportStatus.IN_PROGRESS),
          String(ReportStatus.RESOLVED),
        ]);

        const visible = (data || []).filter((r: any) => {
          if (approvedStatuses.has(String(r.status))) return true;
          if (isAuthenticated && user?.email && r?.user?.email === user.email) return true;
          return false;
        });

        setReports(normalizeReports(visible));
      } catch (err: any) {
        console.error("Failed to load reports:", err);
        if (!mounted) return;
        setReportsError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingReports(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.email, refreshTrigger]);

  // Ripristina scroll sidebar quando cambi selezione
  useEffect(() => {
    const sidebar = document.querySelector(".reports-sidebar-scroll") as HTMLElement | null;
    if (sidebar && sidebarScrollRef.current > 0) sidebar.scrollTop = sidebarScrollRef.current;
  }, [selectedReportId]);

  // --- Derived data --------------------------------------------------------

  // Filter function for sidebar - uses active filters only
  const filterSidebarReports = useCallback((reportsList: Report[]) => {
    return reportsList.filter((report) => {
      const matchesSearch = !sidebarActiveSearchTerm || 
        report.title?.toLowerCase().includes(sidebarActiveSearchTerm.toLowerCase());
      const matchesStatus = !sidebarActiveFilterStatus || report.status === sidebarActiveFilterStatus;
      const matchesCategory = !sidebarActiveFilterCategory || report.category === sidebarActiveFilterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [sidebarActiveSearchTerm, sidebarActiveFilterStatus, sidebarActiveFilterCategory]);

  const recentReports = useMemo(() => {
    const recent = getRecentReports(reports);
    return filterSidebarReports(recent);
  }, [reports, sidebarActiveSearchTerm, sidebarActiveFilterStatus, sidebarActiveFilterCategory]);

  // Extract available statuses and categories from reports
  const availableStatuses = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.status).filter(Boolean)));
  }, [reports]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.category).filter(Boolean)));
  }, [reports]);

  const selectedReport = useMemo(() => {
    if (selectedReportId == null) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const handleReportCardClick = useCallback((reportId: number) => {
    saveSidebarScroll(sidebarScrollRef);
    setSelectedReportId(reportId);
    setShowReportsSidebar(false);
  }, []);

  // Helper functions for conditional rendering
  
  // Memoize helper functions to prevent re-renders
  const renderSidebarHeader = useCallback(() => {
    const title = searchCenter ? "Reports in Selected Area" : "Recent Reports";
    const subtitle = searchCenter 
      ? "Showing reports in the searched location" 
      : "Showing the 10 most recent reports";
    
    return (
      <div>
        <h3 style={{ color: "var(--text)", margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
          {title}
        </h3>
        <small style={{ color: "#6c757d", display: "block", marginTop: "0.25rem" }}>
          {subtitle}
        </small>
      </div>
    );
  }, [searchCenter]);

  // Memoize sidebar reports content  
  const renderSidebarReportsContent = useCallback(() => {
    if (loadingReports) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          Loading reports...
        </div>
      );
    }

    if (reportsError) {
      return (
        <div style={{ color: "var(--danger)", padding: "1rem" }}>
          Error loading reports: {reportsError}
        </div>
      );
    }

    if (recentReports.length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {recentReports.map((report) => {
            const isOwnReport = isUserOwnReport(report, isAuthenticated, user);
            return (
              <div key={report.id} style={{ position: "relative" }}>
                {isOwnReport && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      background: "#e0f7fa",
                      color: "#00796b",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      padding: "2px 8px",
                      borderRadius: "0 0 0.5rem 0",
                      zIndex: 2,
                    }}
                  >
                    Your report
                  </div>
                )}
                <ReportCard
                  report={report}
                  isSelected={selectedReportId === report.id}
                  onClick={() => handleReportCardClick(report.id)}
                  onOpenDetails={handleReportDetailsClick}
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (reports.length > 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "3rem 2rem",
            background: "var(--surface)",
            borderRadius: "0.75rem",
            border: "2px dashed #dee2e6",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5, color: "#6c757d" }}>
            <Clipboard />
          </div>
          <p style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#6c757d", fontWeight: 500 }}>
            No matching reports
          </p>
          <small style={{ fontSize: "0.95rem", color: "#adb5bd" }}>
            Try adjusting your search or filter criteria.
          </small>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <EmptyState
          icon={<Clipboard />}
          title="No reports available"
          description={searchCenter ? "No reports in this area" : "There are no reports in the system yet. Reports will appear here once submitted by citizens."}
        />
      </div>
    );
  }, [loadingReports, reportsError, recentReports, reports.length, searchCenter, isAuthenticated, user, selectedReportId, handleReportCardClick, handleReportDetailsClick]);

  // Memoize sidebar action buttons
  const renderSidebarActionButtons = useCallback(() => {
    if (isPublicRelations) {
      return (
        <Button onClick={() => navigate("/assign-reports")} variant="primary" fullWidth>
          <Pencil className="me-2" />
          Manage reports
        </Button>
      );
    }

    if (isTechnicalOfficer) {
      return (
        <Button onClick={() => navigate("/assign-reports")} variant="primary" fullWidth>
          <Pencil className="me-2" />
          My Reports
        </Button>
      );
    }

    if (isCitizen) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Button onClick={() => navigate("/my-reports")} variant="secondary" fullWidth>
            <FileEarmarkText className="me-2" />
            My Reports
          </Button>
          <Button onClick={handleAddReport} variant="primary" fullWidth>
            <Pencil className="me-2" />
            Select a location
          </Button>
        </div>
      );
    }

    return null;
  }, [isPublicRelations, isTechnicalOfficer, isCitizen, navigate, handleAddReport]);

  // Sidebar content riusabile
  const sidebarContent = (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 1.5rem 1rem 1.5rem",
          borderBottom: "2px solid #f8f9fa",
          background: "#fdfdfd",
        }}
      >
        {renderSidebarHeader()}
      </div>

      {/* Search and Filter Bar */}
      <div style={{ padding: "0 1.5rem", paddingTop: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {/* Search input */}
          <div style={{ flex: 1 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title..."
                value={sidebarSearchTerm}
                onChange={(e) => handleSidebarSearchChange(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>
          {/* Search/Cancel button */}
          <button
            className={`btn btn-sm ${isSearchActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleSearchToggle}
            style={{ minWidth: '70px', fontSize: '0.8rem' }}
          >
            {isSearchActive ? 'Cancel' : 'Search'}
          </button>
        </div>
        
        {/* Filter dropdowns */}
        <div className="row g-2">
          <div className="col-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                <FunnelFill size={12} />
              </span>
              <select
                className="form-select"
                value={sidebarFilterStatus}
                onChange={(e) => handleSidebarStatusChange(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              >
                <option value="">All Statuses</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                <FunnelFill size={12} />
              </span>
              <select
                className="form-select"
                value={sidebarFilterCategory}
                onChange={(e) => handleSidebarCategoryChange(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div
        className="reports-sidebar-scroll"
        style={{
          flex: 1,
          padding: "1.5rem",
          paddingTop: "0.5rem",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db #f9fafb",
        }}
      >
        {renderSidebarReportsContent()}
      </div>

      <div
        style={{
          padding: "1.5rem",
          borderTop: "1px solid #f8f9fa",
          background: "#fdfdfd",
        }}
      >
        {renderSidebarActionButtons()}

        {!isAuthenticated && (
          <div
            style={{
              backgroundColor: "#f8f9ff",
              border: "1px solid #e0e7ff",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginTop: "0.75rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--text)",
                fontSize: "0.85rem",
                fontWeight: "500",
                margin: "0 0 0.5rem 0",
                lineHeight: "1.3",
              }}
            >
              Ready to report an issue?
            </p>
            <p
              style={{
                color: "#6c757d",
                fontSize: "0.75rem",
                margin: "0 0 0.75rem 0",
                lineHeight: "1.3",
              }}
            >
              Log in or create an account to submit reports.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => navigate("/login")}
                className="btn btn-outline-primary"
                style={{
                  color: "var(--primary)",
                  borderColor: "var(--primary)",
                  fontWeight: "500",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.75rem",
                  flex: 1,
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="btn btn-primary"
                style={{
                  fontWeight: "500",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.75rem",
                  flex: 1,
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // --- Render --------------------------------------------------------------

  return (
    <>
      <div style={{ height: "100%", background: "var(--bg)", overflow: "hidden" }}>
        <main style={{ height: "100%", display: "flex", position: "relative" }}>
          {/* Map Section */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "1rem",
                paddingTop: "2rem",
              }}
              className="px-md-4"
            >
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                {/* Address search bar above the map */}
                <div
                  style={{
                    zIndex: 10,
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <AddressSearchBar
                      onSearch={handleAddressSearch}
                      loading={searchLoading}
                      onClear={handleClearAddressSearch}
                      isClearVisible={!!searchCenter}
                      externalError={searchError}
                    />
                  </div>
                  <button
                    className="btn btn-primary d-none d-lg-flex"
                    aria-label="Site information"
                    onClick={() => setShowInfoModal(true)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    i
                  </button>
                </div>
                <MapView
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onReportDetailsClick={handleReportDetailsClick}
                  selectedLocation={searchCenter || undefined}
                  selectedZoom={searchZoom}
                  searchArea={
                    searchAreaBbox ? { bbox: searchAreaBbox } : undefined
                  }
                />
              </div>
            </div>

            {/* Floating button for mobile */}
            <button
              onClick={() => setShowReportsSidebar(true)}
              className="d-lg-none btn btn-primary position-fixed rounded-circle shadow-lg"
              style={{
                bottom: "2rem",
                right: "2rem",
                width: "60px",
                height: "60px",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              <List />
            </button>
          </div>

          {/* Reports Sidebar - Desktop */}
          <div
            className="d-none d-lg-flex"
            style={{
              width: "350px",
              minWidth: "350px",
              maxWidth: "350px",
              background: "var(--surface)",
              flexDirection: "column",
              height: "100%",
              boxShadow: "-2px 0 16px rgba(34, 49, 63, 0.04)",
            }}
          >
            {sidebarContent}
          </div>
        </main>

        {/* Reports Sidebar - Mobile (Offcanvas) */}
        <Offcanvas
          show={showReportsSidebar}
          onHide={() => setShowReportsSidebar(false)}
          placement="end"
          style={{ width: "90%", maxWidth: "400px" }}
        >
          <Offcanvas.Header closeButton style={{ borderBottom: "2px solid #f8f9fa", background: "#fdfdfd" }}>
            <Offcanvas.Title style={{ color: "var(--text)", fontSize: "1.3rem", fontWeight: 700 }}>
              {searchCenter ? "Reports in Selected Area" : "Recent Reports"}
            </Offcanvas.Title>
          </Offcanvas.Header>

          {/* Search and Filter Bar */}
          <div style={{ padding: "1rem 1.5rem 0.5rem 1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {/* Search input */}
              <div style={{ flex: 1 }}>
                <div className="input-group input-group-sm">
                  <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by title..."
                    value={sidebarSearchTerm}
                    onChange={(e) => handleSidebarSearchChange(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              {/* Search/Cancel button */}
              <button
                className={`btn btn-sm ${isSearchActive ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleSearchToggle}
                style={{ minWidth: '70px', fontSize: '0.8rem' }}
              >
                {isSearchActive ? 'Cancel' : 'Search'}
              </button>
            </div>
            
            {/* Filter dropdowns */}
            <div className="row g-2">
              <div className="col-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                    <FunnelFill size={12} />
                  </span>
                  <select
                    className="form-select"
                    value={sidebarFilterStatus}
                    onChange={(e) => handleSidebarStatusChange(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="">All Statuses</option>
                    {availableStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text" style={{ padding: '0.25rem 0.5rem' }}>
                    <FunnelFill size={12} />
                  </span>
                  <select
                    className="form-select"
                    value={sidebarFilterCategory}
                    onChange={(e) => handleSidebarCategoryChange(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <Offcanvas.Body style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div
              className="reports-sidebar-scroll"
              style={{
                flex: 1,
                padding: "1.5rem",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "#d1d5db #f9fafb",
              }}
            >
              {renderSidebarReportsContent()}
            </div>

            {/* Add Report Button in Offcanvas */}
            <div
              style={{
                padding: "1.5rem",
                borderTop: "1px solid #f8f9fa",
                background: "#fdfdfd",
              }}
            >
              {renderSidebarActionButtons()}

              {!isAuthenticated && (
                <div
                  style={{
                    backgroundColor: "#f8f9ff",
                    border: "1px solid #e0e7ff",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    marginTop: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      margin: "0 0 0.5rem 0",
                      lineHeight: "1.3",
                    }}
                  >
                    Ready to report an issue?
                  </p>
                  <p
                    style={{
                      color: "#6c757d",
                      fontSize: "0.75rem",
                      margin: "0 0 0.75rem 0",
                      lineHeight: "1.3",
                    }}
                  >
                    Log in or create an account to submit reports.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => navigate("/login")}
                      className="btn btn-outline-primary"
                      style={{
                        color: "var(--primary)",
                        borderColor: "var(--primary)",
                        fontWeight: "500",
                        padding: "0.25rem 0.6rem",
                        fontSize: "0.75rem",
                        flex: 1,
                      }}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className="btn btn-primary"
                      style={{
                        fontWeight: "500",
                        padding: "0.25rem 0.6rem",
                        fontSize: "0.75rem",
                        flex: 1,
                      }}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </div>

      {selectedReport && (
        <ReportDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          report={selectedReport}
          onReportUpdate={handleReportUpdate}
        />
      )}

      <InfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
}
