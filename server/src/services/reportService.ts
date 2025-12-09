// =========================
// IMPORTS
// =========================

// DTOs and interfaces
import {
  ReportDTO,
  toReportDTO,
  ReportCategory,
  ReportStatus,
} from "../interfaces/ReportDTO";
import { ReportPhoto as SharedReportPhoto } from "../../../shared/ReportTypes";
import { Role } from "../interfaces/UserDTO";

// Repositories
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { ReportPhotoRepository } from "../repositories/ReportPhotoRepository";
import { ReportMessageRepository } from "../repositories/ReportMessageRepository";

// Services and utilities
import {
  notifyReportStatusChange,
  notifyReportAssigned,
  notifyReportApproved,
  notifyReportRejected,
} from "./notificationService";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
  ForbiddenError,
} from "../utils/errors";
import { sendMessageToCitizen } from "./messageService";

// =========================
// REPOSITORY INSTANCES
// =========================

const reportRepository = new ReportRepository();
const userRepository = new UserRepository();
const reportPhotoRepository = new ReportPhotoRepository();
const reportMessageRepository = new ReportMessageRepository();

// =========================
// ENUMS AND TYPES
// =========================

export enum TechnicalType {
  CULTURE_EVENTS_TOURISM_SPORTS = Role.CULTURE_EVENTS_TOURISM_SPORTS,
  LOCAL_PUBLIC_SERVICES = Role.LOCAL_PUBLIC_SERVICES,
  EDUCATION_SERVICES = Role.EDUCATION_SERVICES,
  PUBLIC_RESIDENTIAL_HOUSING = Role.PUBLIC_RESIDENTIAL_HOUSING,
  INFORMATION_SYSTEMS = Role.INFORMATION_SYSTEMS,
  MUNICIPAL_BUILDING_MAINTENANCE = Role.MUNICIPAL_BUILDING_MAINTENANCE,
  PRIVATE_BUILDINGS = Role.PRIVATE_BUILDINGS,
  INFRASTRUCTURES = Role.INFRASTRUCTURES,
  GREENSPACES_AND_ANIMAL_PROTECTION = Role.GREENSPACES_AND_ANIMAL_PROTECTION,
  WASTE_MANAGEMENT = Role.WASTE_MANAGEMENT,
  ROAD_MAINTENANCE = Role.ROAD_MAINTENANCE,
  CIVIL_PROTECTION = Role.CIVIL_PROTECTION,
  EXTERNAL_MAINTAINER = Role.EXTERNAL_MAINTAINER,
}

// Tipo per la creazione di un report
type CreateReportData = Omit<
  ReportDTO,
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "messages"
  | "user"
  | "rejectedReason"
  | "address"
  | "latitude"
  | "longitude"
> & {
  // When creating a report, latitude/longitude are numbers coming from the client
  latitude: number;
  longitude: number;
  userId: number; // add userId to link report to user
  photos: SharedReportPhoto[];
  address?: string;
};

// =========================
// MAPPINGS AND HELPERS
// =========================

const categoryToTechnical: Record<ReportCategory, TechnicalType[]> = {
  [ReportCategory.WATER_SUPPLY_DRINKING_WATER]: [
    TechnicalType.LOCAL_PUBLIC_SERVICES,
    TechnicalType.INFRASTRUCTURES,
  ],
  [ReportCategory.ARCHITECTURAL_BARRIERS]: [
    TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
    TechnicalType.PRIVATE_BUILDINGS,
  ],
  [ReportCategory.SEWER_SYSTEM]: [
    TechnicalType.INFRASTRUCTURES,
    TechnicalType.WASTE_MANAGEMENT,
  ],
  [ReportCategory.PUBLIC_LIGHTING]: [
    TechnicalType.LOCAL_PUBLIC_SERVICES,
    TechnicalType.INFRASTRUCTURES,
  ],
  [ReportCategory.WASTE]: [
    TechnicalType.WASTE_MANAGEMENT,
    TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION,
  ],
  [ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS]: [
    TechnicalType.ROAD_MAINTENANCE,
    TechnicalType.INFRASTRUCTURES,
  ],
  [ReportCategory.ROADS_URBAN_FURNISHINGS]: [
    TechnicalType.ROAD_MAINTENANCE,
    TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
  ],
  [ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS]: [
    TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION,
    TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
  ],
  [ReportCategory.OTHER]: Object.values(TechnicalType),
};


// =========================
// REPORT PUBLIC SERVICES
// =========================

/**
 * Crea un nuovo report
 */
export async function createReport(data: CreateReportData) {
  // Create the report entity
  const savedReport = await reportRepository.create({
    title: data.title,
    description: data.description,
    category: data.category as ReportCategory,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address || null,
    isAnonymous: data.isAnonymous,
    status: ReportStatus.PENDING_APPROVAL,
    userId: data.userId,
  });

  // Create photos separately if any
  if (data.photos && data.photos.length > 0) {
    const photosData = data.photos.map((photo) => ({
      url: photo.url,
      filename: photo.filename,
      reportId: savedReport.id,
    }));
    await reportPhotoRepository.createMany(photosData);
  }

  // Return the report with all relations
  const reportWithRelations = await reportRepository.findByIdWithRelations(
    savedReport.id
  );
  return reportWithRelations!;
}

/**
 * Get a single report by ID with access control
 */
export async function getReportById(
  reportId: number,
  userId: number
): Promise<ReportDTO> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Access control: users can only see reports they created or are assigned to
  const isReportOwner = report.userId === userId;
  const isAssignedTechnical = report.assignedOfficerId === userId;

  if (!isReportOwner && !isAssignedTechnical) {
    throw new ForbiddenError("You are not authorized to view this report");
  }

  return toReportDTO(report);
}

/**
 * Restituisce tutti i report approvati (assegnati, in corso, risolti)
 */
export async function getApprovedReports(
  category?: ReportCategory
): Promise<ReportDTO[]> {
  const reports = await reportRepository.findByStatusAndCategory(
    [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED],
    category
  );

  return reports.map(toReportDTO);
}



// =========================
// REPORT PR SERVICES
// =========================

function getTechnicalTypesForCategory(
  category: ReportCategory
): TechnicalType[] {
  return categoryToTechnical[category] || [];
}

/**
 * Restituisce la lista di tecnici validi per la categoria del report
 * @param reportId id del report
 */
export async function getAssignableTechnicalsForReport(reportId: number) {
  const report = await reportRepository.findById(reportId);
  if (!report) throw new NotFoundError("Report not found");

  const validTechnicalTypes = getTechnicalTypesForCategory(
    report.category as ReportCategory
  );
  // Usiamo i Role esistenti come tipi tecnici: filtriamo gli utenti il cui `role` è in validTechnicalTypes
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);

  const technicals = await userRepository.findByRoles(validRoles as any);
  return technicals;
}

/**
 * Restituisce i report in attesa di approvazione
 */
export async function getPendingReports(): Promise<ReportDTO[]> {
  const reports = await reportRepository.findByStatus([
    ReportStatus.PENDING_APPROVAL,
  ]);
  return reports.map(toReportDTO);
}


/**
 * Approva un report e lo assegna a un tecnico selezionato
 */
export async function approveReport(
  reportId: number,
  approverId: number,
  assignedTechnicalId: number
): Promise<ReportDTO> {
  const report = await reportRepository.findByIdWithRelations(reportId);
  if (!report) throw new NotFoundError("Report not found");
  if (report.status !== ReportStatus.PENDING_APPROVAL) {
    throw new BadRequestError("Report is not in PENDING_APPROVAL status");
  }

  // Verifica che il tecnico assegnato sia valido per la categoria
  const validTechnicalTypes = getTechnicalTypesForCategory(
    report.category as ReportCategory
  );
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);
  const assignedTechnical = await userRepository.findById(assignedTechnicalId);
  if (!assignedTechnical || !validRoles.includes(assignedTechnical.role)) {
    throw new UnprocessableEntityError(
      "Assigned technical is not valid for this report category"
    );
  }

  const updatedReport = await reportRepository.update(reportId, {
    status: ReportStatus.ASSIGNED,
    assignedOfficerId: assignedTechnical.id,
  });

  if (!updatedReport) throw new NotFoundError("Report not found after update");

  await reportMessageRepository.create({
    content: `Your report with title "${report.title}" has been approved and assigned to technical officer: ${assignedTechnical.first_name} ${assignedTechnical.last_name}.`,
    reportId,
    senderId: approverId,
  });
  // Notify citizen about approval
  await notifyReportApproved(report.id, report.userId, report.title);
  // Notify technical user about assignment
  await notifyReportAssigned(report.id, assignedTechnicalId, report.title);

  return toReportDTO(updatedReport);
}

/**
 * Rifiuta un report con motivazione
 */
export async function rejectReport(
  reportId: number,
  rejecterId: number,
  reason: string
): Promise<ReportDTO> {
  if (!reason || reason.trim().length === 0) {
    throw new BadRequestError("Rejection reason is required");
  }
  if (reason.length > 500) {
    throw new UnprocessableEntityError(
      "Rejection reason must be less than 500 characters"
    );
  }

  const report = await reportRepository.findByIdWithRelations(reportId);
  if (!report) {
    throw new NotFoundError("Report not found");
  }
  if (report.status !== ReportStatus.PENDING_APPROVAL) {
    throw new BadRequestError("Report is not in PENDING_APPROVAL status");
  }

  // Update report status and reason
  const updatedReport = await reportRepository.update(reportId, {
    status: ReportStatus.REJECTED,
    rejectedReason: reason,
  });

  if (!updatedReport) throw new NotFoundError("Report not found after update");

  await reportMessageRepository.create({
    content: `Your report with title "${report.title}" has been rejected. The reason is: ${reason}`,
    reportId,
    senderId: rejecterId,
  });
  await notifyReportRejected(report.id, report.userId, report.title, reason);

  return toReportDTO(updatedReport);
}



// =========================
// REPORT TECH/EXTERNAL SERVICES
// =========================

/**
 * Restituisce i report assegnati all'utente tecnico autenticato
 */
export async function getAssignedReportsService(
  userId: number,
  status?: string,
  sortBy: string = "createdAt",
  order: "asc" | "desc" = "desc"
): Promise<ReportDTO[]> {
  // Only allow technical statuses (include EXTERNAL_ASSIGNED to show reports assigned to externals)
  const allowedStatuses = [
    ReportStatus.ASSIGNED,
    ReportStatus.EXTERNAL_ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.RESOLVED,
  ];
  let statusFilter: ReportStatus[] = allowedStatuses;
  if (status && allowedStatuses.includes(status as ReportStatus)) {
    statusFilter = [status as ReportStatus];
  }

  const reports = await reportRepository.findAssignedToUser(
    userId,
    statusFilter
  );
  return reports.map(toReportDTO);
}

/**
 * Get reports assigned to external maintainer
 */
export async function getAssignedReportsForExternalMaintainer(
  externalMaintainerId: number,
  status?: string,
  sortBy: string = "createdAt",
  order: "asc" | "desc" = "desc"
): Promise<ReportDTO[]> {
  // Only allow external technical statuses
  const allowedStatuses = [
    ReportStatus.EXTERNAL_ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.RESOLVED,
  ];
  let statusFilter: ReportStatus[] = allowedStatuses;
  if (status && allowedStatuses.includes(status as ReportStatus)) {
    statusFilter = [status as ReportStatus];
  }

  const reports = await reportRepository.findAssignedToExternalMaintainer(
    externalMaintainerId,
    statusFilter
  );
  return reports.map(toReportDTO);
}

/**
 * Aggiorna lo stato di un report
 */
export async function updateReportStatus(
  reportId: number,
  technicalUserId: number,
  newStatus: ReportStatus
): Promise<ReportDTO> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const isInternalTech = report.assignedOfficerId === technicalUserId;
  const isExternalTech = report.externalMaintainerId === technicalUserId;

  if (!isInternalTech && !isExternalTech) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const oldStatus = report.status;

  const updatedReport = await reportRepository.update(reportId, {
    status: newStatus,
  });
  if (!updatedReport) throw new NotFoundError("Report not found after update");

  // Notify citizen about status change
  await notifyReportStatusChange(
    report.id,
    report.userId,
    oldStatus,
    newStatus
  );

  return toReportDTO(updatedReport);
}
