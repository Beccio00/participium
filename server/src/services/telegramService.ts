import { randomBytes } from "crypto";
import axios from "axios";
import path from "path";
import { UserRepository } from "../repositories/UserRepository";
import { TelegramLinkTokenRepository } from "../repositories/TelegramLinkTokenRepository";
import { BadRequestError, ConflictError, NotFoundError, UnprocessableEntityError } from "../utils";
import { createReport } from "./reportService";
import { ReportCategory } from "../interfaces/ReportDTO";
import minioClient, { BUCKET_NAME } from "../utils/minioClient";
import { calculateAddress } from "../utils/addressFinder";
import { isPointInTurin } from "../../../shared/TurinBoundaries";
import type {
  TelegramTokenResponseDTO,
  TelegramLinkResponseDTO,
  TelegramStatusResponseDTO,
  TelegramUnlinkResponseDTO,
  TelegramCreateReportRequestDTO,
  TelegramCreateReportResponseDTO,
} from "../interfaces/TelegramDTO";

const userRepository = new UserRepository();
const telegramLinkTokenRepository = new TelegramLinkTokenRepository();

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "participium_bot";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const TOKEN_VALIDITY_MINUTES = 15;

function generateRandomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let token = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

export async function generateTelegramLinkToken(
  userId: number
): Promise<TelegramTokenResponseDTO> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.telegram_id) {
    throw new ConflictError("Telegram account already linked to this user");
  }

  await telegramLinkTokenRepository.deleteByUserId(userId);

  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_MINUTES * 60 * 1000);

  await telegramLinkTokenRepository.create({
    token,
    userId,
    expiresAt,
    used: false,
  });

  const deepLink = `https://t.me/${BOT_USERNAME}?start=link_${token}`;

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    deepLink,
    message: "Click the link to connect your Telegram account",
  };
}

export async function linkTelegramAccount(
  token: string,
  telegramId: string,
  telegramUsername?: string | null
): Promise<TelegramLinkResponseDTO> {
  if (!token) {
    throw new BadRequestError("Token is required");
  }
  if (!telegramId) {
    throw new BadRequestError("Telegram ID is required");
  }

  const linkToken = await telegramLinkTokenRepository.findByToken(token);
  
  if (!linkToken) {
    throw new NotFoundError("Invalid token");
  }

  if (linkToken.used) {
    throw new ConflictError("Token has already been used");
  }

  if (new Date() > linkToken.expiresAt) {
    throw new BadRequestError("Token has expired");
  }

  const existingUserWithTelegram = await userRepository.findByTelegramId(telegramId);
  if (existingUserWithTelegram && existingUserWithTelegram.id !== linkToken.userId) {
    throw new ConflictError("This Telegram account is already linked to another user");
  }

  const user = linkToken.user;
  if (!user) {
    throw new NotFoundError("User not found");
  }

  await userRepository.update(user.id, {
    telegram_id: telegramId,
    telegram_username: telegramUsername || null,
  });

  await telegramLinkTokenRepository.markAsUsed(linkToken.id);

  return {
    success: true,
    message: "Telegram account linked successfully",
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    },
  };
}

export async function getTelegramStatus(
  userId: number
): Promise<TelegramStatusResponseDTO> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    linked: !!user.telegram_id,
    telegramUsername: user.telegram_username,
    telegramId: user.telegram_id,
  };
}

export async function unlinkTelegramAccount(
  userId: number
): Promise<TelegramUnlinkResponseDTO> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.telegram_id) {
    throw new NotFoundError("No Telegram account linked to this user");
  }

  await userRepository.update(userId, {
    telegram_id: null,
    telegram_username: null,
  });

  await telegramLinkTokenRepository.deleteByUserId(userId);

  return {
    success: true,
    message: "Telegram account unlinked successfully",
  };
}

export async function createReportFromTelegram(
  data: TelegramCreateReportRequestDTO
): Promise<TelegramCreateReportResponseDTO> {
  const user = await userRepository.findByTelegramId(data.telegramId);
  if (!user) {
    throw new NotFoundError("No account linked to this Telegram ID. Please link your account first.");
  }

  if (!Object.values(ReportCategory).includes(data.category as ReportCategory)) {
    throw new BadRequestError(`Invalid category: ${data.category}`);
  }

  if (!data.title || data.title.trim().length === 0) {
    throw new BadRequestError("Title is required");
  }
  if (!data.description || data.description.trim().length === 0) {
    throw new BadRequestError("Description is required");
  }
  // Validate description length
  const descLen = data.description.trim().length;
  if (descLen < 10) {
    throw new BadRequestError("Description is too short. Please provide at least 10 characters");
  }
  if (descLen > 1000) {
    throw new BadRequestError("Description is too long. Please keep it under 1000 characters");
  }

  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    throw new BadRequestError("Valid latitude and longitude are required");
  }
  if (isNaN(data.latitude) || isNaN(data.longitude)) {
    throw new BadRequestError("Invalid coordinates: latitude and longitude must be valid numbers");
  }
  if (data.latitude < -90 || data.latitude > 90) {
    throw new BadRequestError("Invalid latitude: must be between -90 and 90");
  }
  if (data.longitude < -180 || data.longitude > 180) {
    throw new BadRequestError("Invalid longitude: must be between -180 and 180");
  }

  if (!isPointInTurin(data.latitude, data.longitude)) {
    throw new UnprocessableEntityError("Coordinates are outside Turin municipality boundaries");
  }

  if (!data.photoFileIds || data.photoFileIds.length === 0) {
    throw new BadRequestError("At least one photo is required");
  }
  if (data.photoFileIds.length > 3) {
    throw new BadRequestError("Maximum 3 photos allowed");
  }

  const photos = await downloadAndUploadTelegramPhotos(data.photoFileIds);

  const address = await calculateAddress(data.latitude, data.longitude);

  const report = await createReport({
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category as ReportCategory,
    latitude: data.latitude,
    longitude: data.longitude,
    address,
    isAnonymous: data.isAnonymous ?? false,
    userId: user.id,
    photos,
  });

  return {
    success: true,
    message: "Report created successfully",
    reportId: report.id,
  };
}

async function downloadAndUploadTelegramPhotos(
  fileIds: string[]
): Promise<{ id: number; url: string; filename: string }[]> {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured on server");
  }

  const photos: { id: number; url: string; filename: string }[] = [];

  for (const fileId of fileIds) {
    const fileInfoResponse = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    
    if (!fileInfoResponse.data.ok) {
      throw new BadRequestError("Failed to get file info from Telegram");
    }

    const filePath = fileInfoResponse.data.result.file_path;
    const fileExtension = path.extname(filePath) || ".jpg";
    
    const fileResponse = await axios.get(
      `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(fileResponse.data);
    
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `telegram-${uniqueSuffix}${fileExtension}`;

    const contentType = fileExtension === ".png" ? "image/png" : "image/jpeg";

    await minioClient.putObject(
      BUCKET_NAME,
      filename,
      buffer,
      buffer.length,
      { "Content-Type": contentType }
    );

    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const host = "localhost";
    const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
    const url = `${protocol}://${host}${port}/${BUCKET_NAME}/${filename}`;

    photos.push({ id: 0, url, filename });
  }

  return photos;
}
