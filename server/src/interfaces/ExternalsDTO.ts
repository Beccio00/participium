import { ReportCategory } from "../../../shared/ReportTypes";
import { UserDTO, Role } from "./UserDTO";

export type ExternalCompanyDTO = {
  id: number;
  name: string;
  categories: ReportCategory[];
  platformAccess: boolean;
};

export type ExternalMaintainerDTO = UserDTO & {
  company: ExternalCompanyDTO;
};

export type ExternalHandlerDTO =
  | { type: "user"; user: ExternalMaintainerDTO }
  | { type: "company"; company: ExternalCompanyDTO };



export function toExternalCompanyDTO(c: any): ExternalCompanyDTO {
  return {
    id: c.id,
    name: c.name,
    categories: c.categories as ReportCategory[],
    platformAccess: c.platformAccess,
  };
}

export function toExternalMaintainerDTO(u: any): ExternalMaintainerDTO | null {
  if (!u || !u.externalCompany) return null;
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: u.role as Role,
    telegramUsername: u.telegram_username ?? null,
    emailNotificationsEnabled: u.email_notifications_enabled ?? true,
    company: {
      id: u.externalCompany.id,
      name: u.externalCompany.name,
      categories: u.externalCompany.categories as ReportCategory[],
      platformAccess: u.externalCompany.platformAccess,
    },
  };
}

export function toExternalHandlerDTO(r: any): ExternalHandlerDTO | null {
  if (r.externalMaintainer && r.externalMaintainer.externalCompany) {
    return {
        type: "user",
        user: toExternalMaintainerDTO(r.externalMaintainer)!,
    };
    } else if (r.externalCompany) {
        return {
            type: "company",
            company: toExternalCompanyDTO(r.externalCompany)
        };
    } else {
        return null;
    }
}