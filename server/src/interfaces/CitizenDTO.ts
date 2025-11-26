import type { User, CitizenPhoto } from "@prisma/client";

export type CitizenProfileDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
  photoUrl: string | null;
};

export type CitizenConfigRequestDTO = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  telegramUsername?: string | null;
  emailNotificationsEnabled?: boolean;
};

export type PhotoDTO = {
  id: number;
  url: string;
  filename: string;
};

export type PhotoUploadResponseDTO = {
  message: string;
  photo: PhotoDTO;
};

type UserWithPhoto = User & { photo: CitizenPhoto | null };

export function toCitizenProfileDTO(user: UserWithPhoto): CitizenProfileDTO {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    telegramUsername: user.telegram_username,
    emailNotificationsEnabled: user.email_notifications_enabled,
    photoUrl: user.photo?.url || null,
  };
}
