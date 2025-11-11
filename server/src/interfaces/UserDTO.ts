import type { User as PrismaUser } from "../../prisma/generated/client";

export const Roles = {
  PUBLIC_RELATIONS: "PUBLIC_RELATIONS",
  ADMINISTRATOR: "ADMINISTRATOR",
  TECHNICAL_OFFICE: "TECHNICAL_OFFICE",
  CITIZEN: "CITIZEN",
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export function isValidRole(v: unknown): v is Role {
  return Object.values(Roles).includes(v as Role);
}


export type UserDTO = {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
};

export function toUserDTO(u: PrismaUser): UserDTO {
  return {
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: (Object.values(Roles).includes(String(u.role) as Role) ? (u.role as unknown as Role) : String(u.role) as Role),
    telegramUsername: u.telegram_username ?? null,
    emailNotificationsEnabled: u.email_notifications_enabled ?? true,
  };
}

export const MUNICIPALITY_ROLES: Role[] = [
  Roles.PUBLIC_RELATIONS,
  Roles.TECHNICAL_OFFICE,
];

export type MunicipalityUserDTO = Pick<UserDTO, "firstName" | "lastName" | "email" | "role"> & {
  id: number;
};

export function toMunicipalityUserDTO(u: PrismaUser): MunicipalityUserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: (Object.values(Roles).includes(String(u.role) as Role) ? (u.role as unknown as Role) : String(u.role) as Role),
  };
}
