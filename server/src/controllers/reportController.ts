import { Request, Response } from "express";
import path from "path";
import { createReport as createReportService, getApprovedReports as getApprovedReportsService } from "../services/reportService";
import { ReportCategory } from "../../../shared/ReportTypes";
import { calculateAddress } from "../utils/addressFinder";
import minioClient, { BUCKET_NAME } from "../utils/minioClient";
import { BadRequestError } from "../utils";

export async function createReport(req: Request, res: Response): Promise<void> {
  const photos = req.files as Express.Multer.File[];
  
  const {
    title,
    description,
    category,
    latitude,
    longitude,
    isAnonymous,
  } = req.body;

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