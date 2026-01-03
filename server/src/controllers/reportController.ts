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
  getReportById as getReportByIdService,
} from "../services/reportService";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { calculateAddress } from "../utils/addressFinder";
import minioClient, { BUCKET_NAME } from "../utils/minioClient";
import { BadRequestError, UnauthorizedError } from "../utils";
import { createInternalNote as createInternalNoteService } from "../services/internalNoteService";
import { Role } from "../../../shared/RoleTypes";
import { getInternalNotes } from "../services/internalNoteService";
import { forwardGeocode, validateAddress, validateZoom, parseBoundingBox } from "../services/geocodingService";
import { validateTurinBoundaries, isWithinTurinBoundaries } from "../middlewares/validateTurinBoundaries";

// Helper functions for validation
function validateRequiredFields(
  title: any,
  description: any,
  category: any,
  latitude: any,
  longitude: any
): void {
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
}

function validatePhotos(photos: any[]): void {
  if (!photos || photos.length === 0) {
    throw new BadRequestError("At least one photo is required");
  }
  if (photos.length > 3) {
    throw new BadRequestError("Maximum 3 photos allowed");
  }
}

function validateCategory(category: string): void {
  if (!Object.values(ReportCategory).includes(category as ReportCategory)) {
    throw new BadRequestError(
      `Invalid category. Allowed values: ${Object.values(ReportCategory).join(
        ", "
      )}`
    );
  }
}

function validateAndParseCoordinates(
  latitude: any,
  longitude: any
): { latitude: number; longitude: number } {
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

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

// Helper function to process photos
async function processPhotos(photos: any[]): Promise<any[]> {
  const photoData = [];

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
    const host = "localhost";
    const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
    const url = `${protocol}://${host}${port}/${BUCKET_NAME}/${filename}`;

    photoData.push({
      id: 0,
      filename: filename,
      url: url,
    });
  }

  return photoData;
}

// Helper function to extract photos from request
function extractPhotos(reqFiles: any): any[] {
  if (Array.isArray(reqFiles)) {
    return reqFiles;
  }
  if (reqFiles && reqFiles.photos) {
    return reqFiles.photos;
  }
  return [];
}

// Helper function to resolve address
async function resolveAddress(
  address: string | undefined,
  latitude: number,
  longitude: number
): Promise<string> {
  if (!address || address.trim() === "") {
    return await calculateAddress(latitude, longitude);
  }
  return address;
}

// Helper function to create report data object
function buildReportData(
  title: string,
  description: string,
  category: ReportCategory,
  latitude: number,
  longitude: number,
  address: string,
  isAnonymous: string,
  photoData: any[],
  userId: number
) {
  return {
    title,
    description,
    category,
    latitude,
    longitude,
    isAnonymous: isAnonymous === "true",
    address,
    photos: photoData,
    userId,
  };
}

export async function createReport(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const {
    title,
    description,
    category,
    latitude,
    longitude,
    isAnonymous,
    address,
  } = req.body;

  // Extract and validate photos
  const photos = extractPhotos(req.files);

  // Validate all inputs
  validateRequiredFields(title, description, category, latitude, longitude);
  validatePhotos(photos);
  validateCategory(category);
  const coordinates = validateAndParseCoordinates(latitude, longitude);

  // Process photos and resolve address
  const photoData = await processPhotos(photos);
  const resolvedAddress = await resolveAddress(
    address,
    coordinates.latitude,
    coordinates.longitude
  );

  // Build and create report
  const reportData = buildReportData(
    title,
    description,
    category as ReportCategory,
    coordinates.latitude,
    coordinates.longitude,
    resolvedAddress,
    isAnonymous,
    photoData,
    user.id
  );

  const newReport = await createReportService(reportData);

  res.status(201).json({
    message: "Report created successfully",
    report: newReport,
  });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const { category, bbox } = req.query;

  if (
    category &&
    !Object.values(ReportCategory).includes(category as ReportCategory)
  ) {
    throw new BadRequestError(
      `Invalid category. Allowed: ${Object.values(ReportCategory).join(", ")}`
    );
  }

  // Validate and parse bbox parameter if provided
  let boundingBox;
  if (bbox) {
    try {
      boundingBox = parseBoundingBox(bbox as string);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  const reports = await getApprovedReportsService(category as ReportCategory, boundingBox);
  res.status(200).json(reports);
}

export async function getReportById(
  req: Request,
  res: Response
): Promise<void> {
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

export async function geocodeAddress(req: Request, res: Response): Promise<void> {
  const { address, zoom = 16 } = req.query;

  try {
    // Validate input parameters
    const validatedAddress = validateAddress(address);
    const validatedZoom = validateZoom(zoom);

    // Forward geocoding
    const result = await forwardGeocode(validatedAddress, validatedZoom);

    // Check if coordinates are within Turin boundaries
    if (!isWithinTurinBoundaries(result.latitude, result.longitude)) {
      throw new BadRequestError('Address is outside Turin municipality boundaries');
    }

    res.status(200).json({
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      bbox: result.bbox,
      zoom: result.zoom
    });
  } catch (error: any) {
    if (error.message.includes('Address not found')) {
      throw new BadRequestError('Address not found by geocoding service');
    } else if (error.message.includes('service temporarily unavailable')) {
      res.status(500).json({
        code: 500,
        error: 'InternalServerError',
        message: 'Geocoding service temporarily unavailable'
      });
      return;
    } else if (error instanceof BadRequestError) {
      throw error;
    } else {
      res.status(500).json({
        code: 500,
        error: 'InternalServerError',
        message: 'Geocoding service error'
      });
      return;
    }
  }
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
export async function updateReportStatus(
  req: Request,
  res: Response
): Promise<void> {
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
  const validStatuses = [
    ReportStatus.IN_PROGRESS,
    ReportStatus.SUSPENDED,
    ReportStatus.RESOLVED,
  ];
  if (!validStatuses.includes(status as ReportStatus)) {
    throw new BadRequestError(
      `Invalid status. Allowed values: ${validStatuses.join(", ")}`
    );
  }

  const updatedReport = await updateReportStatusService(
    reportId,
    user.id,
    status as ReportStatus
  );
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
    const allowed = [
      "ASSIGNED",
      "EXTERNAL_ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
    ];
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

export async function createInternalNote(
  req: Request,
  res: Response
): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number; role: Role };
  const { content } = req.body;

  const note = await createInternalNoteService(
    reportId,
    content,
    user.id,
    user.role
  );
  res.status(201).json(note);
}

export async function getInternalNote(
  req: Request,
  res: Response
): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number; role: Role };

  const messages = await getInternalNotes(reportId, user.id);
  res.status(200).json(messages);
}
