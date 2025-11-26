import type { User as PrismaUser } from "@prisma/client";

export const Roles = {
  CITIZEN: "CITIZEN",
  ADMINISTRATOR: "ADMINISTRATOR",
  PUBLIC_RELATIONS: "PUBLIC_RELATIONS",
  CULTURE_EVENTS_TOURISM_SPORTS: "CULTURE_EVENTS_TOURISM_SPORTS",
  LOCAL_PUBLIC_SERVICES: "LOCAL_PUBLIC_SERVICES",
  EDUCATION_SERVICES: "EDUCATION_SERVICES",
  PUBLIC_RESIDENTIAL_HOUSING: "PUBLIC_RESIDENTIAL_HOUSING",
  INFORMATION_SYSTEMS: "INFORMATION_SYSTEMS",
  MUNICIPAL_BUILDING_MAINTENANCE: "MUNICIPAL_BUILDING_MAINTENANCE",
  PRIVATE_BUILDINGS: "PRIVATE_BUILDINGS",
  INFRASTRUCTURES: "INFRASTRUCTURES",
  GREENSPACES_AND_ANIMAL_PROTECTION: "GREENSPACES_AND_ANIMAL_PROTECTION",
  WASTE_MANAGEMENT: "WASTE_MANAGEMENT",
  ROAD_MAINTENANCE: "ROAD_MAINTENANCE",
  CIVIL_PROTECTION: "CIVIL_PROTECTION",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export function isValidRole(v: unknown): v is Role {
  return Object.values(Roles).includes(v as Role);
}

export type UserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  telegramUsername: string | null;
  emailNotificationsEnabled: boolean;
};

export function toUserDTO(u: PrismaUser): UserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: Object.values(Roles).includes(String(u.role) as Role)
      ? (u.role as unknown as Role)
      : (String(u.role) as Role),
    telegramUsername: u.telegram_username ?? null,
    emailNotificationsEnabled: u.email_notifications_enabled ?? true,
  };
}

export const MUNICIPALITY_ROLES: Role[] = [
  Roles.PUBLIC_RELATIONS,
  Roles.CULTURE_EVENTS_TOURISM_SPORTS,
  Roles.LOCAL_PUBLIC_SERVICES,
  Roles.EDUCATION_SERVICES,
  Roles.PUBLIC_RESIDENTIAL_HOUSING,
  Roles.INFORMATION_SYSTEMS,
  Roles.MUNICIPAL_BUILDING_MAINTENANCE,
  Roles.PRIVATE_BUILDINGS,
  Roles.INFRASTRUCTURES,
  Roles.GREENSPACES_AND_ANIMAL_PROTECTION,
  Roles.WASTE_MANAGEMENT,
  Roles.ROAD_MAINTENANCE,
  Roles.CIVIL_PROTECTION,
];

export type MunicipalityUserDTO = Pick<
  UserDTO,
  "firstName" | "lastName" | "email" | "role"
> & {
  id: number;
};

export function toMunicipalityUserDTO(u: PrismaUser): MunicipalityUserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: Object.values(Roles).includes(String(u.role) as Role)
      ? (u.role as unknown as Role)
      : (String(u.role) as Role),
  };
}

export const TECHNICAL_ROLES: Role[] = [
  Roles.CULTURE_EVENTS_TOURISM_SPORTS,
  Roles.LOCAL_PUBLIC_SERVICES,
  Roles.EDUCATION_SERVICES,
  Roles.PUBLIC_RESIDENTIAL_HOUSING,
  Roles.INFORMATION_SYSTEMS,
  Roles.MUNICIPAL_BUILDING_MAINTENANCE,
  Roles.PRIVATE_BUILDINGS,
  Roles.INFRASTRUCTURES,
  Roles.GREENSPACES_AND_ANIMAL_PROTECTION,
  Roles.WASTE_MANAGEMENT,
  Roles.ROAD_MAINTENANCE,
  Roles.CIVIL_PROTECTION,
];