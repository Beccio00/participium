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
  getAssignedReportsService,
  getAssignedReportsForExternalMaintainer,
  getReportById as getReportByIdService
} from "../services/reportService";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { calculateAddress } from "../utils/addressFinder";
import minioClient, { BUCKET_NAME, getMinioObjectUrl } from "../utils/minioClient";
import { BadRequestError, UnauthorizedError, ForbiddenError } from "../utils";
import { createInternalNote as createInternalNoteService } from "../services/internalNoteService";
import { Role } from "../entities/User";
import { getInternalNotes } from "../services/internalNoteService";

export async function createReport(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  // Destructure fields from req.body and req.files
  const { title, description, category, latitude, longitude, isAnonymous, address } =
    req.body;
  // Multer stores files in req.files (array or object depending on config)
  let photos: any[] = [];
  if (Array.isArray(req.files)) {
    photos = req.files;
  } else if (req.files && req.files.photos) {
    photos = req.files.photos;
  }

  // Validate required fields
  if (
    !title ||
    !description ||
    !category ||
    latitude === undefined ||
    longitude === undefined
  ) {
    throw new BadRequestError(
      "Missing required fields: title, description, category, latitude, longitude"
    );
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
    throw new BadRequestError(
      `Invalid category. Allowed values: ${Object.values(ReportCategory).join(
        ", "
      )}`
    );
  }

  // Validate coordinates
  const parsedLatitude = parseFloat(latitude);
  const parsedLongitude = parseFloat(longitude);
  if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
    throw new BadRequestError(
      "Invalid coordinates: latitude and longitude must be valid numbers"
    );
  }

  if (parsedLatitude < -90 || parsedLatitude > 90) {
    throw new BadRequestError("Invalid latitude: must be between -90 and 90");
  }

  if (parsedLongitude < -180 || parsedLongitude > 180) {
    throw new BadRequestError(
      "Invalid longitude: must be between -180 and 180"
    );
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
      const host = /*process.env.MINIO_ENDPOINT || */"localhost";
      const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
      const url = `${protocol}://${host}${port}/${BUCKET_NAME}/${filename}`;

      photoData.push({
        id: 0,
        filename: filename,
        url: url,
      });
    }
  }
  let newReport;
  if (!address || address.trim() === "") {
    const newAddress = await calculateAddress(parsedLatitude, parsedLongitude);
    const reportData = {
    title,
    description,
    category: category as ReportCategory,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    address: newAddress,
    isAnonymous: isAnonymous === "true",
    photos: photoData,
    userId: user.id,
  };
  newReport = await createReportService(reportData);

  }else{
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

  newReport = await createReportService(reportData);

  }

  res.status(201).json({
    message: "Report created successfully",
    report: newReport
  });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const { category } = req.query;

  if (
    category &&
    !Object.values(ReportCategory).includes(category as ReportCategory)
  ) {
    throw new BadRequestError(
      `Invalid category. Allowed: ${Object.values(ReportCategory).join(", ")}`
    );
  }

  const reports = await getApprovedReportsService(
    category as ReportCategory
  );
  res.status(200).json(reports);
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const authReq = req as Request & { user?: any };
  const user = authReq.user;

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID format");
  }

  const report = await getReportByIdService(reportId, user.id);
  res.status(200).json(report);
}



// =========================
// REPORT PR CONTROLLERS
// =========================

// Get pending reports
export async function getPendingReports(
  req: Request,
  res: Response
): Promise<void> {
  const reports = await getPendingReportsService();
  res.status(200).json(reports);
}

// Approve a report
export async function approveReport(
  req: Request,
  res: Response
): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const assignedTechnicalId = (req.body && req.body.assignedTechnicalId) as any;

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }
  
  const assignedIdNum = parseInt(assignedTechnicalId);

  if (!assignedTechnicalId || isNaN(parseInt(assignedTechnicalId))) {
    throw new BadRequestError(
      "Missing or invalid 'assignedTechnicalId' in request body"
    );
  }

  const updatedReport = await approveReportService(
    reportId,
    user.id,
    assignedIdNum
  );
  res.status(200).json({
    message: "Report approved and assigned successfully",
    report: updatedReport,
  });
}

// Get list of assignable technicals for a report
export async function getAssignableTechnicals(
  req: Request,
  res: Response
): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }
  const list = await getAssignableTechnicalsForReportService(reportId);
  res.status(200).json(list);
}

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
    report: updatedReport,
  });
}



// =========================
// REPORT TECH/EXTERNAL CONTROLLERS
// =========================

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

export async function getAssignedReports(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.user as { id: number; role: string };
  if (!user || !user.id) {
    throw new UnauthorizedError("Authentication required");
  }
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const sortBy =
    typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
  const order =
    typeof req.query.order === "string" ? req.query.order : undefined;
  // Validate status
  let statusFilter;
  if (status) {
    const allowed = ["ASSIGNED", "EXTERNAL_ASSIGNED", "IN_PROGRESS", "RESOLVED"];
    if (!allowed.includes(status)) {
      throw new BadRequestError("Invalid status filter");
    }
    statusFilter = status;
  }
  // Validate sortBy and order
  const allowedSort = ["createdAt", "priority"];
  const sortField = allowedSort.includes(sortBy ?? "") ? sortBy! : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";
  
  // Call appropriate service based on user role
  let reports;
  if (user.role === Role.EXTERNAL_MAINTAINER) {
    reports = await getAssignedReportsForExternalMaintainer(
      user.id,
      statusFilter,
      sortField,
      sortOrder
    );
  } else {
    // For internal staff
    reports = await getAssignedReportsService(
      user.id,
      statusFilter,
      sortField,
      sortOrder
    );
  }
  
  res.status(200).json(reports);
}

export async function createInternalNote(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number; role: Role };
  const { content } = req.body;

  const note = await createInternalNoteService(reportId, content, user.id, user.role);
  res.status(201).json(note);
}

export async function getInternalNote(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number; role: Role };

  const messages = await getInternalNotes(reportId, user.id);
  res.status(200).json(messages);
}

