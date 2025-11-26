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
  const reports = await prisma.report.findMany({
    where: {
      assignedToId: userId,
      status: { in: statusFilter },
    },
    include: {
      user: true,
      assignedTo: true,
      photos: true,
      messages: {
        include: { user: true },
      },
    },
    orderBy: {
      [sortBy]: order,
    },
  });
  return reports.map(toReportDTO);
}
import { prisma } from "../utils/prismaClient";
import { ReportDTO, toReportDTO, ReportMessageDTO } from "../interfaces/ReportDTO";
import { ReportPhoto, ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { NotFoundError, BadRequestError, UnprocessableEntityError, ForbiddenError } from "../utils/errors";
import { notifyReportStatusChange, notifyNewMessage, notifyReportAssigned, notifyReportApproved, notifyReportRejected } from "./notificationService";

// =========================
// ENUMS E MAPPATURA LOGICA
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

// =========================
// FUNZIONI DI SERVIZIO
// =========================
// (mapping and enums are declared above; duplicates removed)

/**
 * Restituisce la lista di tecnici validi per la categoria del report
 * @param reportId id del report
 */
export async function getAssignableTechnicalsForReport(reportId: number) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { category: true },
  });
  if (!report) throw new NotFoundError("Report not found");
  const validTechnicalTypes = getTechnicalTypesForCategory(
    report.category as ReportCategory
  );
  // Usiamo i Role esistenti in Prisma come tipi tecnici: filtriamo gli utenti il cui `role` è in validTechnicalTypes
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);
  const technicals = await prisma.user.findMany({
    where: {
      role: { in: validRoles as any },
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
    },
  });
  return technicals;
}

// =========================
// TIPI
// =========================

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
  photos: ReportPhoto[];
  address?: string;
};

/**
 * Crea un nuovo report
 */
export async function createReport(data: CreateReportData) {
  // Qui ci dovrebbe essere la validazione delle foto
  const newReport = await prisma.report.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category as ReportCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || null,
      isAnonymous: data.isAnonymous,
      status: ReportStatus.PENDING_APPROVAL,
      userId: data.userId,
      photos: {
        create: data.photos.map((photo) => ({
          url: photo.url,
          filename: photo.filename,
        })),
      },
    },
    include: {
      user: true,
      photos: true,
    },
  });
  return newReport;
}

/**
 * Restituisce i report approvati (assegnati, in corso, risolti)
 */
export async function getApprovedReports(
  category?: ReportCategory
): Promise<ReportDTO[]> {
  const reports = await prisma.report.findMany({
    where: {
      status: {
        in: [
          ReportStatus.ASSIGNED,
          ReportStatus.IN_PROGRESS,
          ReportStatus.RESOLVED,
        ],
      },
      ...(category && { category }),
    },
    include: {
      user: true,
      photos: true,
      messages: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return reports.map(toReportDTO);
}

/**
 * Restituisce i report in attesa di approvazione
 */
export async function getPendingReports(): Promise<ReportDTO[]> {
  const reports = await prisma.report.findMany({
    where: {
      status: ReportStatus.PENDING_APPROVAL,
    },
    include: {
      user: true,
      photos: true,
      messages: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return reports.map(toReportDTO);
}

/**
 * Approva un report e lo assegna a un tecnico selezionato (solo PUBLIC_RELATIONS)
 */
export async function approveReport(
  reportId: number,
  approverId: number,
  assignedTechnicalId: number
): Promise<ReportDTO> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { user: true },
  });
  if (!report) throw new NotFoundError("Report not found");
  if (report.status !== ReportStatus.PENDING_APPROVAL) {
    throw new BadRequestError("Report is not in PENDING_APPROVAL status");
  }
  // Verifica che il tecnico assegnato sia valido per la categoria
  const validTechnicalTypes = getTechnicalTypesForCategory(
    report.category as ReportCategory
  );
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);
  const assignedTechnical = await prisma.user.findUnique({
    where: { id: assignedTechnicalId },
    select: {
      id: true,
      role: true,
      email: true,
      first_name: true,
      last_name: true,
    },
  });
  if (!assignedTechnical || !validRoles.includes(assignedTechnical.role)) {
    throw new UnprocessableEntityError(
      "Assigned technical is not valid for this report category"
    );
  }
  await prisma.report.update({
    where: { id: reportId },
    // cast `data` to any because generated Prisma types may not expose the relation scalar in the union
    data: {
      status: ReportStatus.ASSIGNED,
      assignedToId: assignedTechnical.id,
    } as unknown as any,
  });

  // Recupera il report e poi carica separatamente l'utente assegnato (per evitare problemi di typing con Prisma client)
  const updatedBase = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      user: true,
      photos: true,
      messages: {
        include: {
          user: true,
        },
      },
    },
  });
  if (!updatedBase) throw new NotFoundError("Report not found after update");

  if ((updatedBase as any).assignedToId) {
    const assigned = await prisma.user.findUnique({
      where: { id: (updatedBase as any).assignedToId },
    });
    (updatedBase as any).assignedTo = assigned ?? null;
  }

  // Notify citizen about approval
  await notifyReportApproved(report.id, report.userId, report.title);

  // Notify technical user about assignment
  await notifyReportAssigned(report.id, assignedTechnicalId, report.title);

  return toReportDTO(updatedBase as any);
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
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { user: true },
  });
  if (!report) {
    throw new NotFoundError("Report not found");
  }
  if (report.status !== ReportStatus.PENDING_APPROVAL) {
    throw new BadRequestError("Report is not in PENDING_APPROVAL status");
  }
  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    // cast to any to avoid mismatches with generated Prisma client types
    data: {
      status: ReportStatus.REJECTED,
      rejectedReason: reason,
      messages: {
        create: {
          content: "Report rejected by public relations officer",
          senderId: rejecterId,
        },
      },
    } as unknown as any,
    include: {
      user: true,
      photos: true,
      messages: {
        include: {
          user: true,
        },
      },
    },
  });
  // Notify citizen about rejection
  await notifyReportRejected(report.id, report.userId, report.title, reason);

  return toReportDTO(updatedReport);
}

/**
 * Aggiorna lo stato di un report (solo technical)
 */
export async function updateReportStatus(
  reportId: number,
  technicalUserId: number,
  newStatus: ReportStatus
): Promise<ReportDTO> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { user: true, assignedTo: true },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Verifica che il technical sia assegnato a questo report
  if (report.assignedToId !== technicalUserId) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const oldStatus = report.status;

  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: { status: newStatus },
    include: {
      user: true,
      photos: true,
      messages: {
        include: {
          user: true,
        },
      },
    },
  });

  // Carica separatamente l'utente assegnato (per evitare problemi di typing con Prisma client)
  if ((updatedReport as any).assignedToId) {
    const assigned = await prisma.user.findUnique({
      where: { id: (updatedReport as any).assignedToId },
    });
    (updatedReport as any).assignedTo = assigned ?? null;
  }

  // Notify citizen about status change
  await notifyReportStatusChange(report.id, report.userId, oldStatus, newStatus);

  return toReportDTO(updatedReport as any);
}

/**
 * Invia un messaggio al cittadino (solo technical)
 */
export async function sendMessageToCitizen(
  reportId: number,
  technicalUserId: number,
  content: string
): Promise<ReportMessageDTO> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { user: true, assignedTo: true },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Verifica che il technical sia assegnato a questo report
  if (report.assignedToId !== technicalUserId) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const message = await prisma.reportMessage.create({
    data: {
      content,
      reportId,
      senderId: technicalUserId,
    },
    include: {
      user: true,
    },
  });

  // Notifica il cittadino del nuovo messaggio
  const senderName = `${report.assignedTo?.first_name} ${report.assignedTo?.last_name}`;
  await notifyNewMessage(report.id, report.userId, senderName);

  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
  };
}

/**
 * Ottieni tutti i messaggi di un report (cittadino o technical)
 */
export async function getReportMessages(
  reportId: number,
  userId: number
): Promise<ReportMessageDTO[]> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      messages: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      user: true,
    },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Verifica autorizzazione: il cittadino può vedere solo i propri report, il technical può vedere i report assegnati
  const isReportOwner = report.userId === userId;
  const isAssignedTechnical = report.assignedToId === userId;
  
  if (!isReportOwner && !isAssignedTechnical) {
    throw new ForbiddenError("You are not authorized to view this conversation");
  }

  return report.messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
  }));
}

