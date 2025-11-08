import type { User as PrismaUser } from "../../prisma/generated/client";

export type MunicipalityUserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type MunicipalityUserCreateRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
};

export type MunicipalityUserUpdateRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
};

export function toMunicipalityUserDTO(u: PrismaUser): MunicipalityUserDTO {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: String(u.role),
  };
}