import { prisma } from "../utils/prismaClient";
import {
  ReportCategory as PrismaReportCategory,
  ReportStatus as PrismaReportStatus,
} from "../../prisma/generated/client";
import { ReportDTO } from "../interfaces/ReportDTO";
import { ReportPhoto } from "../../../shared/ReportTypes";

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
> & {
  userId: number; //add userId to link report to user
  photos: ReportPhoto[];
  //here we can add photos handling later
};

export async function createReport(data: CreateReportData) {
  //here ther should be validation for the photos

  const newReport = await prisma.report.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category as PrismaReportCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      isAnonymous: data.isAnonymous,
      status: PrismaReportStatus.PENDING_APPROVAL, //new reports are always pending approval
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

//get reports only after being approved
export async function getApprovedReports() {
  return prisma.report.findMany({
    where: {
      status: {
        in: [
          PrismaReportStatus.ASSIGNED,
          PrismaReportStatus.IN_PROGRESS,
          PrismaReportStatus.RESOLVED,
        ],
      },
    },
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", //most recent first
    },
  });
}
