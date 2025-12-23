import { randomBytes } from "crypto";
import { UserRepository } from "../repositories/UserRepository";
import { TelegramLinkTokenRepository } from "../repositories/TelegramLinkTokenRepository";
import { BadRequestError, ConflictError, NotFoundError } from "../utils";
import type {
  TelegramTokenResponseDTO,
  TelegramLinkResponseDTO,
  TelegramStatusResponseDTO,
  TelegramUnlinkResponseDTO,
} from "../interfaces/TelegramDTO";

const userRepository = new UserRepository();
const telegramLinkTokenRepository = new TelegramLinkTokenRepository();

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "participium_bot";

const TOKEN_VALIDITY_MINUTES = 15;

function generateRandomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars like 0, O, I, 1
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

  const linkToken = await telegramLinkTokenRepository.findValidByToken(token);
  if (!linkToken) {
    throw new BadRequestError("Invalid or expired token");
  }

  if (new Date() > linkToken.expiresAt) {
    throw new BadRequestError("Invalid or expired token");
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
