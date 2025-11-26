import { Request, Response } from "express";
import path from "path";
import { 
  createReport as createReportService, 
  getApprovedReports as getApprovedReportsService,
  getPendingReports as getPendingReportsService,
  approveReport as approveReportService,
  rejectReport as rejectReportService,
  getAssignableTechnicalsForReport as getAssignableTechnicalsForReportService,
  updateReportStatus as updateReportStatusService,
  sendMessageToCitizen as sendMessageToCitizenService,
  getReportMessages as getReportMessagesService
} from "../services/reportService";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { calculateAddress } from "../utils/addressFinder";
import minioClient, { BUCKET_NAME } from "../utils/minioClient";
import { BadRequestError, UnauthorizedError, ForbiddenError } from "../utils";
import { asyncHandler } from "../middlewares/errorMiddleware";

export async function createReport(req: Request, res: Response): Promise<void> {
        const user = req.user as { id: number };

        // Validate required fields
        if (
          !title ||
          !description ||
          !category ||
          latitude === undefined ||
          longitude === undefined
        ) {
          throw new BadRequestError("Missing required fields: title, description, category, latitude, longitude");
        }

        // Validate photos
        if (!photos || photos.length === 0) {
          throw new BadRequestError("At least one photo is required");
        }

        if (photos.length > 3) {
          throw new BadRequestError("Maximum 3 photos allowed");
        }

        // Validate category
        if (!Object.values(ReportCategory).includes(category as ReportCategory)) {
          throw new BadRequestError(`Invalid category. Allowed values: ${Object.values(ReportCategory).join(", ")}`);
        }

        // Validate coordinates
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);

        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
          throw new BadRequestError("Invalid coordinates: latitude and longitude must be valid numbers");
        }

        if (parsedLatitude < -90 || parsedLatitude > 90) {
          throw new BadRequestError("Invalid latitude: must be between -90 and 90");
        }

        if (parsedLongitude < -180 || parsedLongitude > 180) {
          throw new BadRequestError("Invalid longitude: must be between -180 and 180");
        }

        const photoData = [];

        if (photos && photos.length > 0) {
          for (const photo of photos) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const filename = uniqueSuffix + path.extname(photo.originalname);

            await minioClient.putObject(
              BUCKET_NAME,
              filename,
              photo.buffer,
              photo.size,
              { "Content-Type": photo.mimetype }
            );

            const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
            const host = process.env.MINIO_ENDPOINT || "localhost";
            const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
            const url = `${protocol}://${host}${port}/${BUCKET_NAME}/${filename}`;

            photoData.push({
              id: 0,
              filename: filename,
              url: url,
            });
          }
        }

        const address = await calculateAddress(parsedLatitude, parsedLongitude);

        const reportData = {
          title,
          description,
          category: category as ReportCategory,
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          address,
          isAnonymous: isAnonymous === "true",
          photos: photoData,
          userId: user.id,
        };

  const newReport = await createReportService(reportData);

  res.status(201).json({
    message: "Report created successfully",
    id: newReport.id,
  });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const { category } = req.query;

  if (category && !Object.values(ReportCategory).includes(category as ReportCategory)) {
    throw new BadRequestError(`Invalid category. Allowed: ${Object.values(ReportCategory).join(", ")}`);
  }

  const reports = await getApprovedReportsService(category as ReportCategory | undefined);
  res.status(200).json(reports);
}
// Get pending reports (PUBLIC_RELATIONS only)
export async function getPendingReports(req: Request, res: Response): Promise<void> {
  const reports = await getPendingReportsService();
  res.status(200).json(reports);
}

// Approve a report (PUBLIC_RELATIONS only)
export async function approveReport(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const { assignedTechnicalId } = req.body;

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  if (!assignedTechnicalId || isNaN(parseInt(assignedTechnicalId))) {
    throw new BadRequestError("Missing or invalid 'assignedTechnicalId' in request body");
  }

  const assignedIdNum = parseInt(assignedTechnicalId);

  const updatedReport = await approveReportService(reportId, user.id, assignedIdNum);
  res.status(200).json({
    message: "Report approved and assigned successfully",
    report: updatedReport
  });
}

// Get list of assignable technicals for a report (PUBLIC_RELATIONS only)
export async function getAssignableTechnicals (req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }
  const list = await getAssignableTechnicalsForReportService(reportId);
  res.status(200).json(list);
};

// Reject a report (PUBLIC_RELATIONS only)
export async function rejectReport(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const { reason } = req.body;
  
  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      throw new BadRequestError("Missing rejection reason");
    }

  const updatedReport = await rejectReportService(reportId, user.id, reason);
  res.status(200).json({
    message: "Report rejected successfully",
    report: updatedReport
  });
}

// Update report status
export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const { status } = req.body;

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  if (!status || typeof status !== "string") {
    throw new BadRequestError("Status is required");
  }

  // Validate status
  const validStatuses = [ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED, ReportStatus.RESOLVED];
  if (!validStatuses.includes(status as ReportStatus)) {
    throw new BadRequestError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`);
  }

  const updatedReport = await updateReportStatusService(reportId, user.id, status as ReportStatus);
  res.status(200).json({
    message: "Report status updated successfully",
    report: updatedReport,
  });
}

// Send message to citizen
export async function sendMessageToCitizen(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const { content } = req.body;

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new BadRequestError("Message content is required");
  }

  const message = await sendMessageToCitizenService(reportId, user.id, content);
  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
}

// Get report conversation history
export async function getReportMessages(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  const messages = await getReportMessagesService(reportId, user.id);
  res.status(200).json(messages);
}
