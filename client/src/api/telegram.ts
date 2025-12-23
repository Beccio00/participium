import { API_PREFIX } from "./api";
import type {
  TelegramTokenResponse,
  TelegramStatusResponse,
  TelegramUnlinkResponse,
} from "../types/telegram.types";

// Re-export types for convenience
export type { TelegramTokenResponse, TelegramStatusResponse, TelegramUnlinkResponse };

// Helper for response handling
async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }
  if (res.ok) return data as T;
  const message =
    (data && (data.message || data.error)) ||
    res.statusText ||
    "Request failed";
  const err = new Error(message);
  (err as any).status = res.status;
  (err as any).body = data;
  throw err;
}

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
