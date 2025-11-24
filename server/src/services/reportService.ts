import { prisma } from "../utils/prismaClient";
import { ReportDTO, toReportDTO } from "../interfaces/ReportDTO";
import { ReportPhoto, ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { NotFoundError, BadRequestError, UnprocessableEntityError } from "../utils/errors";

//new type where we exclude fields that will not be provided by the user
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

export async function createReport(data: CreateReportData) {
  //here ther should be validation for the photos

  const newReport = await prisma.report.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category as ReportCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || null,
      isAnonymous: data.isAnonymous,
      status: ReportStatus.PENDING_APPROVAL, //new reports are pending municipality approval
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

// Approve a report (PUBLIC_RELATIONS only)
export async function approveReport(reportId: number, approverId: number): Promise<ReportDTO> {
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
    data: {
      status: ReportStatus.ASSIGNED,
      messages: {
        create: {
          content: "Report approved by public relations officer",
          senderId: approverId,
        },
      },
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
  });

  return toReportDTO(updatedReport);
}

// Reject a report with reason (PUBLIC_RELATIONS only)
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
    data: {
      status: ReportStatus.REJECTED,
      rejectionReason: reason,
      messages: {
        create: {
          content: "Report rejected by public relations officer",
          senderId: rejecterId,
        },
      },
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
  });

  return toReportDTO(updatedReport);
}
