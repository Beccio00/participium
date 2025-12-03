import { User } from "../entities/User";
import { Role } from "../../../shared/RoleTypes";

export const Roles = Role;

export { Role };

export const MUNICIPALITY_ROLES: Role[] = [
  Role.PUBLIC_RELATIONS,
  Role.CULTURE_EVENTS_TOURISM_SPORTS,
  Role.LOCAL_PUBLIC_SERVICES,
  Role.EDUCATION_SERVICES,
  Role.PUBLIC_RESIDENTIAL_HOUSING,
  Role.INFORMATION_SYSTEMS,
  Role.MUNICIPAL_BUILDING_MAINTENANCE,
  Role.PRIVATE_BUILDINGS,
  Role.INFRASTRUCTURES,
  Role.GREENSPACES_AND_ANIMAL_PROTECTION,
  Role.WASTE_MANAGEMENT,
  Role.ROAD_MAINTENANCE,
  Role.CIVIL_PROTECTION,
];

export const TECHNICAL_ROLES: Role[] = [
  Role.CULTURE_EVENTS_TOURISM_SPORTS,
  Role.LOCAL_PUBLIC_SERVICES,
  Role.EDUCATION_SERVICES,
  Role.PUBLIC_RESIDENTIAL_HOUSING,
  Role.INFORMATION_SYSTEMS,
  Role.MUNICIPAL_BUILDING_MAINTENANCE,
  Role.PRIVATE_BUILDINGS,
  Role.INFRASTRUCTURES,
  Role.GREENSPACES_AND_ANIMAL_PROTECTION,
  Role.WASTE_MANAGEMENT,
  Role.ROAD_MAINTENANCE,
  Role.CIVIL_PROTECTION,
];

export function isValidRole(v: unknown): v is Role {
  return Object.values(Role).includes(v as Role);
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

export function toUserDTO(u: User): UserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: Object.values(Role).includes(String(u.role) as Role)
      ? (u.role as unknown as Role)
      : (String(u.role) as Role),
    telegramUsername: u.telegram_username ?? null,
    emailNotificationsEnabled: u.email_notifications_enabled ?? true,
  };
}

export type MunicipalityUserDTO = Pick<
  UserDTO,
  "firstName" | "lastName" | "email" | "role"
> & {
  id: number;
};

export function toMunicipalityUserDTO(u: User): MunicipalityUserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: Object.values(Role).includes(String(u.role) as Role)
      ? (u.role as unknown as Role)
      : (String(u.role) as Role),
  };
}