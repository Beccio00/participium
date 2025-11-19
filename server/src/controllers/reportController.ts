import { Request, Response } from "express";
import {
  createReport as createReportService,
  getApprovedReports as getApprovedReportsService,
} from "../services/reportService";
import { UserDTO } from "../interfaces/UserDTO";
import { 
  ReportCategory
 } from "../../../shared/ReportTypes";
 import { calculateAddress } from "../utils/addressFinder";
import path from "path";
import minioClient, {BUCKET_NAME} from "../utils/minioClient";

export const createReport = async (req: Request, res: Response) => {
  try {
    const photos = req.files as Express.Multer.File[];

    const {
      title,
      description,
      category,
      latitude,
      longitude,
      isAnonymous,
    } = req.body;

    const user = req.user as UserDTO & { id: number }; //need to get the userId

    //citizen must be logged in to create a report
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not logged in",
      });
    }

    //validate required fields maybe can move it to service
    if (
      !title ||
      !description ||
      !category ||
      latitude === undefined ||
      longitude === undefined ||
      !photos
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Missing required fields",
      });
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
          { 'Content-Type': photo.mimetype } 
        );

        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const host = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : '';
        const url = `${protocol}://${host}${port}/${BUCKET_NAME}/${filename}`;

        photoData.push({
          id: 0,
          filename: filename,
          url: url 
        });
      }
    }

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

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

    return res.status(201).json({
      message: "Report created successfully",
      id: newReport.id,
    });
  } catch (err) {
    console.error("Error creating report", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Unable to create report",
    });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await getApprovedReportsService();
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error during report retrieval:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Error during report retrieval",
    });
  }
};
