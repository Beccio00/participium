import prisma from '../utils/prismaClient';
import {
     ReportDTO, 
     ReportCategory, 
     ReportStatus 
} from '../interfaces/ReportDTO';

export async function createReport(data: ReportDTO & { userId: number }) {
  //validation: minimum one photo, maximum three photos
  if (!data.photos || data.photos.length === 0) {
    throw new Error("At least one photo is required");
  }
  if (data.photos.length > 3) {
    throw new Error("Maximum 3 photos allowed");
  }

  const newReport = await prisma.report.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category as ReportCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      isAnonymous: data.isAnonymous,
      status: ReportStatus.PENDING_APPROVAL, // Sempre pending all'inizio
      userId: data.userId,
      //here we need to handle th photos, but not fot story4
    },
    include: {
      user: true,
      //photos: true,
    },
  });
  
  return newReport;
}

//get reports only after being approved
export async function getApprovedReports() {
  return prisma.report.findMany({
    where: {
      status: {
        in: [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED]
      }
    },
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true
        }
      },
      //photos: true,
    },
  });
}