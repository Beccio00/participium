// =========================
// IMPORTS
// =========================

// DTOs and interfaces
import { ReportDTO, toReportDTO, ReportMessageDTO , ReportCategory, ReportStatus} from "../interfaces/ReportDTO";
import { ReportPhoto as SharedReportPhoto } from "../../../shared/ReportTypes";

// Repositories
import { ReportRepository } from "../repositories/ReportRepository";
import { ReportMessageRepository } from "../repositories/ReportMessageRepository";
import { UserRepository } from "../repositories/UserRepository";
import { ReportPhotoRepository } from "../repositories/ReportPhotoRepository";

// Services and utilities
import { notifyReportStatusChange, notifyNewMessage, notifyReportAssigned, notifyReportApproved, notifyReportRejected } from "./notificationService";
import { NotFoundError, BadRequestError, UnprocessableEntityError, ForbiddenError } from "../utils/errors";

// =========================
// REPOSITORY INSTANCES
// =========================

const reportRepository = new ReportRepository();
const reportMessageRepository = new ReportMessageRepository(); 
const userRepository = new UserRepository();
const reportPhotoRepository = new ReportPhotoRepository();

// =========================
// ENUMS AND TYPES
// =========================

export enum TechnicalType {
  CULTURE_EVENTS_TOURISM_SPORTS = "CULTURE_EVENTS_TOURISM_SPORTS",
  LOCAL_PUBLIC_SERVICES = "LOCAL_PUBLIC_SERVICES",
  EDUCATION_SERVICES = "EDUCATION_SERVICES",
  PUBLIC_RESIDENTIAL_HOUSING = "PUBLIC_RESIDENTIAL_HOUSING",
  INFORMATION_SYSTEMS = "INFORMATION_SYSTEMS",
  MUNICIPAL_BUILDING_MAINTENANCE = "MUNICIPAL_BUILDING_MAINTENANCE",
  PRIVATE_BUILDINGS = "PRIVATE_BUILDINGS",
  INFRASTRUCTURES = "INFRASTRUCTURES",
  GREENSPACES_AND_ANIMAL_PROTECTION = "GREENSPACES_AND_ANIMAL_PROTECTION",
  WASTE_MANAGEMENT = "WASTE_MANAGEMENT",
  ROAD_MAINTENANCE = "ROAD_MAINTENANCE",
  CIVIL_PROTECTION = "CIVIL_PROTECTION",
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

// =========================
// REPORT MANAGEMENT FUNCTIONS
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
  // Only allow technical statuses
  const allowedStatuses = [
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.RESOLVED,
  ];
  let statusFilter: ReportStatus[] = allowedStatuses;
  if (status && allowedStatuses.includes(status as ReportStatus)) {
    statusFilter = [status as ReportStatus];
  }
  
  const reports = await reportRepository.findAssignedToUser(userId, statusFilter);
  return reports.map(toReportDTO);
}

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
  const reportWithRelations = await reportRepository.findByIdWithRelations(savedReport.id);
  return reportWithRelations!;
}

/**
 * Restituisce i report approvati (assegnati, in corso, risolti)
 */
export async function getApprovedReports(
  category?: ReportCategory
): Promise<ReportDTO[]> {
  const reports = await reportRepository.findByStatusAndCategory([
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.RESOLVED,
  ], category);
  
  return reports.map(toReportDTO);
}

/**
 * Restituisce i report in attesa di approvazione
 */
export async function getPendingReports(): Promise<ReportDTO[]> {
  const reports = await reportRepository.findByStatus([ReportStatus.PENDING_APPROVAL]);
  return reports.map(toReportDTO);
}

// =========================
// APPROVAL AND REJECTION FUNCTIONS
// =========================

/**
 * Approva un report e lo assegna a un tecnico selezionato (solo PUBLIC_RELATIONS)
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
    assignedToId: assignedTechnical.id,
  });

  if (!updatedReport) throw new NotFoundError("Report not found after update");

  // Notify citizen about approval
  await notifyReportApproved(report.id, report.userId, report.title);

  // Notify technical user about assignment
  await notifyReportAssigned(report.id, assignedTechnicalId, report.title);

  return toReportDTO(updatedReport);
}

/**
 * Rifiuta un report con motivazione (solo PUBLIC_RELATIONS)
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
  
  // Create rejection message
  await reportMessageRepository.create({
    content: "Report rejected by public relations officer",
    senderId: rejecterId,
    reportId: reportId,
  });
  
  if (!updatedReport) throw new NotFoundError("Report not found after update");
  
  // Notify citizen about rejection
  await notifyReportRejected(report.id, report.userId, report.title, reason);

  return toReportDTO(updatedReport);
}

// =========================
// TECHNICAL USER FUNCTIONS
// =========================

/**
 * Aggiorna lo stato di un report (solo technical)
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

  // Verifica che il technical sia assegnato a questo report
  if (report.assignedToId !== technicalUserId) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const oldStatus = report.status;

  const updatedReport = await reportRepository.update(reportId, { status: newStatus });
  if (!updatedReport) throw new NotFoundError("Report not found after update");

  // Notify citizen about status change
  await notifyReportStatusChange(report.id, report.userId, oldStatus, newStatus);

  return toReportDTO(updatedReport);
}

/**
 * Invia un messaggio al cittadino (solo technical)
 */
export async function sendMessageToCitizen(
  reportId: number,
  technicalUserId: number,
  content: string
): Promise<ReportMessageDTO> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Verifica che il technical sia assegnato a questo report
  if (report.assignedToId !== technicalUserId) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const savedMessage = await reportMessageRepository.create({
    content,
    reportId,
    senderId: technicalUserId,
  });

  // Notifica il cittadino del nuovo messaggio
  const senderName = `${report.assignedTo?.first_name} ${report.assignedTo?.last_name}`;
  await notifyNewMessage(report.id, report.userId, senderName);

  return {
    id: savedMessage.id,
    content: savedMessage.content,
    createdAt: savedMessage.createdAt.toISOString(),
    senderId: savedMessage.senderId,
  };
}

// =========================
// MESSAGE FUNCTIONS
// =========================

/**
 * Ottieni tutti i messaggi di un report (cittadino o technical)
 */
export async function getReportMessages(
  reportId: number,
  userId: number
): Promise<ReportMessageDTO[]> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Verifica autorizzazione: il cittadino può vedere solo i propri report, il technical può vedere i report assegnati
  const isReportOwner = report.userId === userId;
  const isAssignedTechnical = report.assignedToId === userId;
  
  if (!isReportOwner && !isAssignedTechnical) {
    throw new ForbiddenError("You are not authorized to view this conversation");
  }

  const messages = await reportMessageRepository.findByReportId(reportId);

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
  }));
}

