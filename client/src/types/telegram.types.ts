// Telegram-related types

export interface TelegramTokenResponse {
  token: string;
  expiresAt: string;
  deepLink: string;
  message: string;
}

export interface TelegramStatusResponse {
  linked: boolean;
  telegramUsername: string | null;
  telegramId: string | null;
}

export interface TelegramUnlinkResponse {
  success: boolean;
  message: string;
}
