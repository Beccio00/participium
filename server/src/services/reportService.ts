import { prisma } from "../utils/prismaClient";
import { ReportDTO, toReportDTO } from "../interfaces/ReportDTO";
import { ReportPhoto, ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { NotFoundError, BadRequestError, UnprocessableEntityError } from "../utils/errors";

// =========================
// ENUMS E MAPPATURA LOGICA
// =========================

export enum TechnicalType {
  CULTURE_EVENTS_TOURISM_SPORTS = 'CULTURE_EVENTS_TOURISM_SPORTS',
  LOCAL_PUBLIC_SERVICES = 'LOCAL_PUBLIC_SERVICES',
  EDUCATION_SERVICES = 'EDUCATION_SERVICES',
  PUBLIC_RESIDENTIAL_HOUSING = 'PUBLIC_RESIDENTIAL_HOUSING',
  INFORMATION_SYSTEMS = 'INFORMATION_SYSTEMS',
  MUNICIPAL_BUILDING_MAINTENANCE = 'MUNICIPAL_BUILDING_MAINTENANCE',
  PRIVATE_BUILDINGS = 'PRIVATE_BUILDINGS',
  INFRASTRUCTURES = 'INFRASTRUCTURES',
  GREENSPACES_AND_ANIMAL_PROTECTION = 'GREENSPACES_AND_ANIMAL_PROTECTION',
  WASTE_MANAGEMENT = 'WASTE_MANAGEMENT',
  ROAD_MAINTENANCE = 'ROAD_MAINTENANCE',
  CIVIL_PROTECTION = 'CIVIL_PROTECTION',
}

const categoryToTechnical: Record<ReportCategory, TechnicalType[]> = {
  [ReportCategory.WATER_SUPPLY_DRINKING_WATER]: [TechnicalType.LOCAL_PUBLIC_SERVICES, TechnicalType.INFRASTRUCTURES],
  [ReportCategory.ARCHITECTURAL_BARRIERS]: [TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE, TechnicalType.PRIVATE_BUILDINGS],
  [ReportCategory.SEWER_SYSTEM]: [TechnicalType.INFRASTRUCTURES, TechnicalType.WASTE_MANAGEMENT],
  [ReportCategory.PUBLIC_LIGHTING]: [TechnicalType.LOCAL_PUBLIC_SERVICES, TechnicalType.INFRASTRUCTURES],
  [ReportCategory.WASTE]: [TechnicalType.WASTE_MANAGEMENT, TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION],
  [ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS]: [TechnicalType.ROAD_MAINTENANCE, TechnicalType.INFRASTRUCTURES],
  [ReportCategory.ROADS_URBAN_FURNISHINGS]: [TechnicalType.ROAD_MAINTENANCE, TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE],
  [ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS]: [TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION, TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE],
  [ReportCategory.OTHER]: Object.values(TechnicalType),
};

function getTechnicalTypesForCategory(category: ReportCategory): TechnicalType[] {
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
    select: { category: true }
  });
  if (!report) throw new NotFoundError("Report not found");
  const validTechnicalTypes = getTechnicalTypesForCategory(report.category as ReportCategory);
  // Usiamo i Role esistenti in Prisma come tipi tecnici: filtriamo gli utenti il cui `role` è in validTechnicalTypes
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);
  const technicals = await prisma.user.findMany({
    where: {
      role: { in: validRoles as any }
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
    }
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
> & {
  userId: number; //add userId to link report to user
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
export async function getApprovedReports(category?: ReportCategory): Promise<ReportDTO[]> {
  const reports = await prisma.report.findMany({
    where: {
      status: {
        in: [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED],
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
export async function approveReport(reportId: number, approverId: number, assignedTechnicalId: number): Promise<ReportDTO> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { user: true },
  });
  if (!report) throw new NotFoundError("Report not found");
  if (report.status !== ReportStatus.PENDING_APPROVAL) {
    throw new BadRequestError("Report is not in PENDING_APPROVAL status");
  }
  // Verifica che il tecnico assegnato sia valido per la categoria
  const validTechnicalTypes = getTechnicalTypesForCategory(report.category as ReportCategory);
  const validRoles = validTechnicalTypes.map((t) => t as unknown as any);
  const assignedTechnical = await prisma.user.findUnique({
    where: { id: assignedTechnicalId },
    select: { id: true, role: true, email: true, first_name: true, last_name: true }
  });
  if (!assignedTechnical || !validRoles.includes(assignedTechnical.role)) {
    throw new UnprocessableEntityError("Assigned technical is not valid for this report category");
  }
  await prisma.report.update({
    where: { id: reportId },
    // cast `data` to any because generated Prisma types may not expose the relation scalar in the union
    data: ({
      status: ReportStatus.ASSIGNED,
      assignedToId: assignedTechnical.id,
    } as unknown) as any,
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
    const assigned = await prisma.user.findUnique({ where: { id: (updatedBase as any).assignedToId } });
    (updatedBase as any).assignedTo = assigned ?? null;
  }

  return toReportDTO(updatedBase as any);
}

/**
 * Rifiuta un report con motivazione (solo PUBLIC_RELATIONS)
 */
export async function rejectReport(reportId: number, rejecterId: number, reason: string): Promise<ReportDTO> {
  if (!reason || reason.trim().length === 0) {
    throw new BadRequestError("Rejection reason is required");
  }
  if (reason.length > 500) {
    throw new UnprocessableEntityError("Rejection reason must be less than 500 characters");
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
    data: ({
      status: ReportStatus.REJECTED,
      rejectedReason: reason,
      messages: {
        create: {
          content: "Report rejected by public relations officer",
          senderId: rejecterId,
        },
      },
    } as unknown) as any,
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
  return toReportDTO(updatedReport);
}
