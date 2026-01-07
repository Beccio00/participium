import { API_PREFIX, handleResponse } from "./api";
import type {
  TelegramTokenResponse,
  TelegramStatusResponse,
  TelegramUnlinkResponse,
} from "../types/telegram.types";

// Re-export types for convenience
export type { TelegramTokenResponse, TelegramStatusResponse, TelegramUnlinkResponse };

/**
 * Get the current Telegram linking status
 * GET /api/telegram/status
 */
export async function getTelegramStatus(): Promise<TelegramStatusResponse> {
  const res = await fetch(`${API_PREFIX}/telegram/status`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<TelegramStatusResponse>(res);
}

/**
 * Generate a token and deep link for Telegram account linking
 * POST /api/telegram/generate-token
 */
export async function generateTelegramToken(): Promise<TelegramTokenResponse> {
  const res = await fetch(`${API_PREFIX}/telegram/generate-token`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<TelegramTokenResponse>(res);
}

/**
 * Unlink the Telegram account
 * DELETE /api/telegram/unlink
 */
export async function unlinkTelegram(): Promise<TelegramUnlinkResponse> {
  const res = await fetch(`${API_PREFIX}/telegram/unlink`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<TelegramUnlinkResponse>(res);
}
