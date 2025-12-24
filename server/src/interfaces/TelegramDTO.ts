export interface TelegramTokenResponseDTO {
  token: string;
  expiresAt: string; // ISO 8601 format
  deepLink: string;
  message: string;
}

export interface TelegramLinkRequestDTO {
  token: string;
  telegramId: string;
  telegramUsername?: string | null;
}

export interface TelegramLinkResponseDTO {
  success: boolean;
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TelegramStatusResponseDTO {
  linked: boolean;
  telegramUsername: string | null;
  telegramId: string | null;
}

export interface TelegramUnlinkResponseDTO {
  success: boolean;
  message: string;
}

export interface TelegramCreateReportRequestDTO {
  telegramId: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  isAnonymous?: boolean;
  photoFileIds?: string[];
}

export interface TelegramCreateReportResponseDTO {
  success: boolean;
  message: string;
  reportId: number;
}
