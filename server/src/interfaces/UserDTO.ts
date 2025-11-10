import type { User as PrismaUser } from "../../prisma/generated/client";

export type UserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
};

export function toUserDTO(u: PrismaUser): UserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: String(u.role),
    telegramUsername: u.telegram_username ?? null,
    emailNotificationsEnabled: u.email_notifications_enabled ?? true,
  };
}
