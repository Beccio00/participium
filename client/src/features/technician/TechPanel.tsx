import { useState, useEffect, useMemo } from "react";
import { Container, Accordion } from "react-bootstrap";
import { FileText, Clipboard, BoxSeam } from "react-bootstrap-icons";
import { useAuth } from "../../hooks";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AccessRestricted from "../../components/AccessRestricted";
import SearchAndFilterBar from "../../components/ui/SearchAndFilterBar";
import EmptyState from "../../components/ui/EmptyState";
import ReportsList from "./ReportsList";
import TechPanelModals from "./TechPanelModals";
import {
  getReports,
  getPendingReports,
  rejectReport,
  getAssignableTechnicals,
  approveReport,
  getAssignedReports,
  getAssignableExternals,
  assignReportToExternal,
  updateReportStatus,
  createInternalNote,
  getInternalNotes,
} from "../../api/api";
import { 
  MUNICIPALITY_AND_EXTERNAL_ROLES, 
  TECHNICIAN_ROLES, 
  userHasRole,
  userHasAnyRole 
} from "../../utils/roles";
import type { Report as AppReport, InternalNote } from "../../types/report.types";
import { Role } from "../../../../shared/RoleTypes";
import { ReportStatus } from "../../../../shared/ReportTypes";
import "../../styles/TechPanelstyle.css";

// Helper functions
function normalizeReports(reports: any[]): AppReport[] {
  return (reports || []).map((r: any) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

function filterExternalMaintainerReports(reports: any[], userId: number): any[] {
  return reports.filter((r: any) => {
    const handlerUserId = r.externalHandler?.user?.id;
    return handlerUserId != null && handlerUserId === userId;
  });
}

function filterTechnicalPendingReports(reports: any[], allowedStatuses: string[]): any[] {
  return reports.filter((r: any) => {
    const hasAllowedStatus = r.status === ReportStatus.ASSIGNED.toString() ||
      allowedStatuses.includes(r.status);
    const hasNoExternalHandler = !Boolean(r.externalHandler);
    return hasAllowedStatus && hasNoExternalHandler;
  });
}

function filterExternalAssignedReports(reports: any[]): any[] {
  return reports.filter((r: any) => Boolean(r.externalHandler));
}

export default function TechPanel() {
  const { user, isAuthenticated } = useAuth();

  const [pendingReports, setPendingReports] = useState<AppReport[]>([]);
  const [otherReports, setOtherReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Selection state
  const [showInternalNoteModal, setShowInternalNoteModal] = useState(false);

  const [assignableTechnicals, setAssignableTechnicals] = useState<any[]>([]);
  const [assignableExternals, setAssignableExternals] = useState<any[]>([]);
  const [selectedTechnicalId, setSelectedTechnicalId] = useState<number | null>(
    null
  );
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null
  );
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form data state
  const [targetStatus, setTargetStatus] = useState<string>("");

  const [rejectionReason, setRejectionReason] = useState("");
  const [internalNoteContent, setInternalNoteContent] = useState("");

  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [processingId, setProcessingId] = useState<number | null>(null);

  // Search and filter states - separate for each accordion section
  const [searchTermSection1, setSearchTermSection1] = useState("");
  const [filterStatusSection1, setFilterStatusSection1] = useState<string>("");
  const [filterCategorySection1, setFilterCategorySection1] = useState<string>("");
  
  const [searchTermSection2, setSearchTermSection2] = useState("");
  const [filterStatusSection2, setFilterStatusSection2] = useState<string>("");
  const [filterCategorySection2, setFilterCategorySection2] = useState<string>("");

  const isPublicRelations = userHasRole(user, Role.PUBLIC_RELATIONS);
  const isExternalMaintainer = userHasRole(user, Role.EXTERNAL_MAINTAINER);

  const [noteModalError, setNoteModalError] = useState<string | null>(null);
  const [toast, setToast] = useState({show: false, message: "", variant: "success" });
  const showToastMessage = (message: string, variant = "success") => {
    setToast({ show: true, message, variant });
  };

  const TECHNICAL_ALLOWED_STATUSES = [
    { value: ReportStatus.IN_PROGRESS.toString(), label: "In Progress" },
    { value: ReportStatus.RESOLVED.toString(), label: "Resolved" },
    { value: ReportStatus.SUSPENDED.toString(), label: "Work suspended" },
  ];

  // Filter function
  const filterReports = (reports: AppReport[], searchTerm: string, filterStatus: string, filterCategory: string) => {
    return reports.filter(report => {
      // Search by title
      const matchesSearch = searchTerm === "" || 
        (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = filterStatus === "" || report.status === filterStatus;
      
      // Filter by category
      const matchesCategory = filterCategory === "" || report.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  // Get unique categories and statuses for each section
  const availableCategoriesSection1 = useMemo(() => {
    const categories = new Set<string>();
    const reportsToCheck = isPublicRelations ? otherReports : pendingReports;
    reportsToCheck.forEach(report => {
      if (report.category) categories.add(report.category);
    });
    return Array.from(categories).sort();
  }, [isPublicRelations, otherReports, pendingReports]);

  const availableStatusesSection1 = useMemo(() => {
    const statuses = new Set<string>();
    const reportsToCheck = isPublicRelations ? otherReports : pendingReports;
    reportsToCheck.forEach(report => {
      if (report.status) statuses.add(report.status);
    });
    return Array.from(statuses).sort();
  }, [isPublicRelations, otherReports, pendingReports]);

  const availableCategoriesSection2 = useMemo(() => {
    const categories = new Set<string>();
    const reportsToCheck = isPublicRelations ? pendingReports : otherReports;
    reportsToCheck.forEach(report => {
      if (report.category) categories.add(report.category);
    });
    return Array.from(categories).sort();
  }, [isPublicRelations, pendingReports, otherReports]);

  const availableStatusesSection2 = useMemo(() => {
    const statuses = new Set<string>();
    const reportsToCheck = isPublicRelations ? pendingReports : otherReports;
    reportsToCheck.forEach(report => {
      if (report.status) statuses.add(report.status);
    });
    return Array.from(statuses).sort();
  }, [isPublicRelations, pendingReports, otherReports]);

  // Filtered reports for each section
  const filteredSection1Reports = useMemo(() => 
    isPublicRelations 
      ? filterReports(otherReports, searchTermSection1, filterStatusSection1, filterCategorySection1)
      : filterReports(pendingReports, searchTermSection1, filterStatusSection1, filterCategorySection1),
    [isPublicRelations, otherReports, pendingReports, searchTermSection1, filterStatusSection1, filterCategorySection1]
  );
  
  const filteredSection2Reports = useMemo(() => 
    isPublicRelations
      ? filterReports(pendingReports, searchTermSection2, filterStatusSection2, filterCategorySection2)
      : filterReports(otherReports, searchTermSection2, filterStatusSection2, filterCategorySection2),
    [isPublicRelations, pendingReports, otherReports, searchTermSection2, filterStatusSection2, filterCategorySection2]
  );

  // Computed values with useMemo for performance and correct reactivity
  const allReports = useMemo(
    () => [...pendingReports, ...otherReports],
    [pendingReports, otherReports]
  );

  const selectedReport = useMemo(
    () => allReports.find((r) => r.id === selectedReportId) || null,
    [allReports, selectedReportId]
  );

  const currentReportStatus = selectedReport?.status;

  const availableStatusOptions = useMemo(
    () => TECHNICAL_ALLOWED_STATUSES.filter((s) => s.value !== currentReportStatus),
    [currentReportStatus]
  );

  const selectedCompany = useMemo(
    () => assignableExternals.find((ext) => ext.id === selectedExternalId),
    [assignableExternals, selectedExternalId]
  );

  const hasAccess = isAuthenticated && user && userHasAnyRole(user, MUNICIPALITY_AND_EXTERNAL_ROLES);

  useEffect(() => {
    if (hasAccess) {
      fetchReports();
    }
  }, [hasAccess]);

  // Check access before rendering
  if (!hasAccess) {
    const message = !isAuthenticated
      ? "You need to be logged in to access this page."
      : "You don't have permission to access the reports management panel.";
    
    return <AccessRestricted message={message} showLoginButton={!isAuthenticated} />;
  }

  const fetchReportsForPublicRelations = async () => {
    const pendingData = (await getPendingReports()) as AppReport[];
    const otherData = (await getReports()) as AppReport[];
    setPendingReports(normalizeReports(pendingData));
    setOtherReports(normalizeReports(otherData));
  };

  const fetchReportsForExternalMaintainer = async () => {
    const assignedData = (await getAssignedReports()) as AppReport[];
    const userId = (user as any)?.id;
    if (!userId) {
      setPendingReports([]);
      setOtherReports([]);
      return;
    }
    const filtered = filterExternalMaintainerReports(assignedData, userId);
    setPendingReports(normalizeReports(filtered));
    setOtherReports([]);
  };

  const fetchReportsForTechnicalOffice = async () => {
    const assignedData = (await getAssignedReports()) as AppReport[];
    const allowedStatuses = TECHNICAL_ALLOWED_STATUSES.map((s) => s.value);
    const pending = filterTechnicalPendingReports(assignedData, allowedStatuses);
    const external = filterExternalAssignedReports(assignedData);
    setPendingReports(normalizeReports(pending));
    setOtherReports(normalizeReports(external));
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (isPublicRelations) {
        await fetchReportsForPublicRelations();
      } else if (isExternalMaintainer) {
        await fetchReportsForExternalMaintainer();
      } else {
        await fetchReportsForTechnicalOffice();
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  // --- ASSIGNMENT LOGIC ---

  const openAssignModal = async (id: number) => {
    try {
      setProcessingId(id);
      let technicals = [];
      let externals = [];

      if (user && userHasRole(user,Role.PUBLIC_RELATIONS)) {
        try {
          technicals = await getAssignableTechnicals(id);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable technicals",
            err
          );
          setError("Errore nel recupero dei tecnici assegnabili.");
          setProcessingId(null);
          return;
        }
      } else if (user && userHasAnyRole(user, TECHNICIAN_ROLES)) {
        try {
          externals = await getAssignableExternals(id);
        } catch (err) {
          console.error(
            "[TechPanel] Failed to fetch assignable externals",
            err
          );
          setError("Error during fetching assignable externals.");
          setProcessingId(null);
          return;
        }
      }
      setAssignableTechnicals(technicals || []);
      setAssignableExternals(externals || []);

      setSelectedReportId(id);
      setSelectedTechnicalId(
        technicals && technicals.length > 0 ? technicals[0].id : null
      );
      setSelectedExternalId(
        externals && externals.length > 0 ? externals[0].id : null
      );
      setShowAssignModal(true);
    } catch (err) {
      setError("Unexpected error opening the assign modal.");
      console.error("[TechPanel] Unexpected error in openAssignModal", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReportDetailsClick = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);
    setTimeout(() => {
      const reportCard = document.querySelector(`[data-report-id="${reportId}"]`) as HTMLElement;
      if (reportCard) reportCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const assignToPublicRelations = async (reportId: number, technicalId: number) => {
    const res = await approveReport(reportId, technicalId);
    return res?.report || null;
  };

  const assignToExternal = async (reportId: number, externalId: number, technicalId: number | null) => {
    const res = await assignReportToExternal(reportId, externalId, technicalId);
    return res?.report || null;
  };

  const shouldAssignWithTechnician = (company: any, technicalId: number | null): boolean => {
    return Boolean(
      company &&
      company.hasPlatformAccess &&
      Array.isArray(company.users) &&
      company.users.length > 0 &&
      technicalId
    );
  };

  const handleConfirmAssign = async () => {
    if (!selectedReportId) return;
    try {
      setProcessingId(selectedReportId);
      let updatedReport = null;

      if (user && userHasRole(user, Role.PUBLIC_RELATIONS) && selectedTechnicalId) {
        updatedReport = await assignToPublicRelations(selectedReportId, selectedTechnicalId);
      } else if (user && selectedExternalId) {
        const selectedCompany = assignableExternals.find(
          (ext) => ext.id === selectedExternalId
        );
        const techId = shouldAssignWithTechnician(selectedCompany, selectedTechnicalId)
          ? selectedTechnicalId
          : null;
        updatedReport = await assignToExternal(selectedReportId, selectedExternalId, techId);
      }

      if (updatedReport) {
        const normalized = {
          ...updatedReport,
          latitude: Number((updatedReport as any).latitude),
          longitude: Number((updatedReport as any).longitude),
        } as AppReport;

        // Move report from pending to other
        setPendingReports((prev) =>
          prev.filter((r) => r.id !== selectedReportId)
        );
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowAssignModal(false);
      setSelectedReportId(null);
      setSelectedTechnicalId(null);
      setSelectedExternalId(null);
    } catch (err) {
      console.error("[TechPanel] Failed to assign report:", err);
      alert(
        "Failed to assign report: " +
          ((err as any)?.message || JSON.stringify(err))
      );
    } finally {
      setProcessingId(null);
    }
  };

  // --- STATUS UPDATE LOGIC (For Technicians) ---

  const openStatusModal = (id: number) => {
    setSelectedReportId(id);
    setTargetStatus("");
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedReportId || !targetStatus) return;

    // Prevent updating to the same status
    const currentReport = [...pendingReports, ...otherReports].find(
      (r) => r.id === selectedReportId
    );
    if (currentReport && currentReport.status === targetStatus) {
      alert("The selected status is the same as the current status.");
      return;
    }

    try {
      setProcessingId(selectedReportId);
      await updateReportStatus(selectedReportId, targetStatus);

      // Update local state to reflect change immediately without refetching everything
      setPendingReports((prev) =>
        prev.map((r) =>
          r.id === selectedReportId ? { ...r, status: targetStatus } : r
        )
      );

      setShowStatusModal(false);
      setSelectedReportId(null);
      setTargetStatus("");
    } catch (err) {
      console.error("Failed to update status", err);
      alert((err as any)?.message || "Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  // --- REJECTION LOGIC (For PR) ---

  const openRejectModal = (id: number) => {
    setSelectedReportId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedReportId || !rejectionReason.trim()) return;

    try {
      setProcessingId(selectedReportId);
      const res = await rejectReport(selectedReportId, rejectionReason);
      const updatedReport = res && res.report ? res.report : null;
      if (updatedReport) {
        const normalized = {
          ...updatedReport,
          latitude: Number((updatedReport as any).latitude),
          longitude: Number((updatedReport as any).longitude),
        } as AppReport;
        setPendingReports((prev) =>
          prev.filter((r) => r.id !== selectedReportId)
        );
        setOtherReports((prev) => [normalized, ...(prev || [])]);
      }
      setShowRejectModal(false);
    } catch (err) {
      console.error("Failed to reject report", err);
      alert((err as any)?.message || "Failed to reject report");
    } finally {
      setProcessingId(null);
    }
  };

  const openNoteModal = async (id: number) => {
    setSelectedReportId(id);
    setInternalNoteContent("");
    setInternalNotes([]);
    setNoteModalError(null);
    setShowInternalNoteModal(true);

    try {
      setLoadingNotes(true);
      const notes = await getInternalNotes(id);
      setInternalNotes(notes);
    } catch (e) {
      console.error("Failed to fetch internal notes", e);
      setNoteModalError("Failed to load internal notes.");
    } finally {
      setLoadingNotes(false);
    }
  }

  const handleInternalNoteSubmit = async () =>{
    if (!selectedReportId || !internalNoteContent.trim()) return;

    try{
      setProcessingId(selectedReportId);
       await createInternalNote(selectedReportId, {
        reportId: selectedReportId,
        content: internalNoteContent,
        authorId: user!.id,
      });

      setShowInternalNoteModal(false);
      showToastMessage("Internal note created successfully", "success");
    }catch(e){
      console.error("Failed to create internal note", e);
      setNoteModalError("Failed to create internal note.");
    }finally{
      setProcessingId(null);
    }
  }
  

  const formatDate = (dateString: Date | string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };
  

  // statusVariant is now implemented in ReportCard; TechPanel no longer needs it

  if (loading) return <div className="loading-container"><LoadingSpinner /></div>;

  return (
    <Container className="py-4 tech-panel-container">
      <div className="mb-4 text-center">
        <h2 style={{ color: "var(--text)", fontWeight: 700 }}>Reports Management</h2>
        <p className="text-muted">
          View and manage reports assigned to you
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--navbar-accent) 85%, var(--primary) 15%) 0%, color-mix(in srgb, var(--navbar-accent) 60%, var(--stone) 40%) 60%)",
            borderRadius: "12px",
            padding: "1.5rem",
            color: "white",
            boxShadow: "0 4px 12px rgba(200, 110, 98, 0.2)"
          }}>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0.5rem" }}>
              {isPublicRelations ? "All Reports" : "Assigned to me"}
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
              {isPublicRelations ? otherReports.length : pendingReports.length}
            </div>
          </div>
        </div>
        {!isExternalMaintainer && (
          <div className="col-md-6">
            <div style={{
              background: "var(--stone)",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "white",
              boxShadow: "0 4px 12px rgba(133, 122, 116, 0.2)"
            }}>
              <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0.5rem" }}>
                {isPublicRelations ? "Pending Approval" : "Assigned to External"}
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {isPublicRelations ? pendingReports.length : otherReports.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Accordion className="mb-4">
        {isPublicRelations ? (
          <>
            {/* --- PUBLIC RELATIONS VIEW --- */}

            {/* Accordion Item 1: All Reports */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>All Reports ({otherReports.length})</Accordion.Header>
              <Accordion.Body>
                <SearchAndFilterBar
                  searchTerm={searchTermSection1}
                  onSearchChange={setSearchTermSection1}
                  filterStatus={filterStatusSection1}
                  onStatusChange={setFilterStatusSection1}
                  filterCategory={filterCategorySection1}
                  onCategoryChange={setFilterCategorySection1}
                  availableStatuses={availableStatusesSection1}
                  availableCategories={availableCategoriesSection1}
                />
                {filteredSection1Reports.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={64} />}
                    title={otherReports.length === 0 ? "No non-pending reports available" : "No reports match your search criteria"}
                    description={otherReports.length === 0 ? "Reports will appear here once they are processed." : "Try adjusting your filters or search term."}
                  />
                ) : (
                  <ReportsList
                    reports={filteredSection1Reports}
                    variant="public-relations-all"
                    processingId={processingId}
                    onOpenDetails={handleReportDetailsClick}
                  />
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Accordion Item 2: Pending Reports */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>Pending Reports ({pendingReports.length})</Accordion.Header>
              <Accordion.Body>
                <SearchAndFilterBar
                  searchTerm={searchTermSection2}
                  onSearchChange={setSearchTermSection2}
                  filterStatus={filterStatusSection2}
                  onStatusChange={setFilterStatusSection2}
                  filterCategory={filterCategorySection2}
                  onCategoryChange={setFilterCategorySection2}
                  availableStatuses={availableStatusesSection2}
                  availableCategories={availableCategoriesSection2}
                  lockedStatus="PENDING_APPROVAL"
                />
                {filteredSection2Reports.length === 0 ? (
                  <EmptyState
                    icon={<Clipboard size={64} />}
                    title={pendingReports.length === 0 ? "No pending reports" : "No reports match your search criteria"}
                    description={pendingReports.length === 0 ? "New reports awaiting approval will appear here." : "Try adjusting your filters or search term."}
                  />
                ) : (
                  <ReportsList
                    reports={filteredSection2Reports}
                    variant="public-relations-pending"
                    processingId={processingId}
                    onOpenDetails={handleReportDetailsClick}
                    onReject={openRejectModal}
                    onAssign={openAssignModal}
                  />
                )}
              </Accordion.Body>
            </Accordion.Item>
          </>
        ) : (
          <>
            {/* --- TECHNICAL OFFICE & EXTERNAL VIEW --- */}

            {/* Accordion Item 1: Assigned to me */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>Assigned to me ({pendingReports.length})</Accordion.Header>
              <Accordion.Body>
                <SearchAndFilterBar
                  searchTerm={searchTermSection1}
                  onSearchChange={setSearchTermSection1}
                  filterStatus={filterStatusSection1}
                  onStatusChange={setFilterStatusSection1}
                  filterCategory={filterCategorySection1}
                  onCategoryChange={setFilterCategorySection1}
                  availableStatuses={availableStatusesSection1}
                  availableCategories={availableCategoriesSection1}
                />
                {filteredSection1Reports.length === 0 ? (
                  <EmptyState
                    icon={<Clipboard size={64} />}
                    title={pendingReports.length === 0 ? "No reports assigned to you" : "No reports match your search criteria"}
                    description={pendingReports.length === 0 ? "Reports will appear here once assigned by public relations." : "Try adjusting your filters or search term."}
                  />
                ) : (
                  <ReportsList
                    reports={filteredSection1Reports}
                    variant="technical-assigned"
                    processingId={processingId}
                    onOpenDetails={handleReportDetailsClick}
                    onStatusUpdate={openStatusModal}
                    onAssign={openAssignModal}
                    onOpenNotes={openNoteModal}
                    isExternalMaintainer={isExternalMaintainer}
                    showAssignModal={showAssignModal}
                  />
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Accordion Item 2: Assigned by me to External (only for Technical Office) */}
            {!isExternalMaintainer && (
              <Accordion.Item eventKey="1">
                <Accordion.Header>Assigned by me to External ({otherReports.length})</Accordion.Header>
                <Accordion.Body>
                  <SearchAndFilterBar
                    searchTerm={searchTermSection2}
                    onSearchChange={setSearchTermSection2}
                    filterStatus={filterStatusSection2}
                    onStatusChange={setFilterStatusSection2}
                    filterCategory={filterCategorySection2}
                    onCategoryChange={setFilterCategorySection2}
                    availableStatuses={availableStatusesSection2}
                    availableCategories={availableCategoriesSection2}
                  />
                  {filteredSection2Reports.length === 0 ? (
                    <EmptyState
                      icon={<BoxSeam size={64} />}
                      title={otherReports.length === 0 ? "No reports assigned to externals yet" : "No reports match your search criteria"}
                      description={otherReports.length === 0 ? "External assignments will appear here when you delegate reports." : "Try adjusting your filters or search term."}
                    />
                  ) : (
                    <ReportsList
                      reports={filteredSection2Reports}
                      variant="technical-external"
                      processingId={processingId}
                      onOpenDetails={handleReportDetailsClick}
                      onOpenNotes={openNoteModal}
                    />
                  )}
                </Accordion.Body>
              </Accordion.Item>
            )}
          </>
        )}
      </Accordion>

      <TechPanelModals
        showRejectModal={showRejectModal}
        onCloseRejectModal={() => setShowRejectModal(false)}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onConfirmReject={handleRejectConfirm}
        showAssignModal={showAssignModal}
        onCloseAssignModal={() => setShowAssignModal(false)}
        isPublicRelations={isPublicRelations}
        assignableExternals={assignableExternals}
        assignableTechnicals={assignableTechnicals}
        selectedExternalId={selectedExternalId}
        onExternalIdChange={setSelectedExternalId}
        selectedTechnicalId={selectedTechnicalId}
        onTechnicalIdChange={setSelectedTechnicalId}
        selectedCompany={selectedCompany}
        onConfirmAssign={handleConfirmAssign}
        showStatusModal={showStatusModal}
        onCloseStatusModal={() => setShowStatusModal(false)}
        targetStatus={targetStatus}
        onTargetStatusChange={setTargetStatus}
        availableStatusOptions={availableStatusOptions}
        onConfirmStatus={handleStatusConfirm}
        showInternalNoteModal={showInternalNoteModal}
        onCloseInternalNoteModal={() => setShowInternalNoteModal(false)}
        internalNoteContent={internalNoteContent}
        onInternalNoteContentChange={setInternalNoteContent}
        internalNotes={internalNotes}
        loadingNotes={loadingNotes}
        noteModalError={noteModalError}
        onCloseNoteModalError={() => setNoteModalError(null)}
        onSubmitInternalNote={handleInternalNoteSubmit}
        formatDate={formatDate}
        showDetailsModal={showDetailsModal}
        onCloseDetailsModal={() => setShowDetailsModal(false)}
        selectedReport={selectedReport}
        toast={toast}
        onCloseToast={() => setToast({ ...toast, show: false })}
        processingId={processingId}
        selectedReportId={selectedReportId}
      />
    </Container>
  );
}
