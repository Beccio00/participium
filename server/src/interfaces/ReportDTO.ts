import { UserDTO, Role, MunicipalityUserDTO } from './UserDTO';
import { ReportCategory, ReportStatus, ReportPhoto } from "../../../shared/ReportTypes";
import { ExternalHandlerDTO } from "./ExternalsDTO";

export { ReportCategory, ReportStatus };

export type ReportDTO = {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
    latitude: string;
    longitude: string;
  address: string;
  isAnonymous: boolean;
  status: ReportStatus;
  user?: UserDTO;
  assignedOfficer?: MunicipalityUserDTO | null;
  externalHandler?: ExternalHandlerDTO | null;
  messages: ReportMessageDTO[];
  rejectedReason?: string | null;
  photos: ReportPhoto[];
  createdAt: string;
  updatedAt: string;
};

export type ReportMessageDTO = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  senderRole: Role;
};



export function toReportDTO(r: any): ReportDTO {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        latitude: String(r.latitude),
        longitude: String(r.longitude),
        address: r.address,
        isAnonymous: r.isAnonymous,
    status: r.status as ReportStatus,
        user: r.user ? {
            id: r.user.id,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            email: r.user.email,
            role: r.user.role as Role,
            telegramUsername: r.user.telegram_username ?? null,
            emailNotificationsEnabled: r.user.email_notifications_enabled ?? true,
        } : undefined,
        assignedOfficer: r.assignedOfficer ? {
          id: r.assignedOfficer.id,
          firstName: r.assignedOfficer.first_name,
          lastName: r.assignedOfficer.last_name,
          email: r.assignedOfficer.email,
          role: r.assignedOfficer.role as Role,
        } : null,
        externalHandler:
          r.externalMaintainer && r.externalMaintainer.externalCompany? ({
            type: 'user',
            user: {
              id: r.externalMaintainer.id,
              firstName: r.externalMaintainer.first_name,
              lastName: r.externalMaintainer.last_name,
              email: r.externalMaintainer.email,
              role: r.externalMaintainer.role as Role,
              company: {
                id: r.externalMaintainer.externalCompany.id,
                name: r.externalMaintainer.externalCompany.name,
                categories: r.externalMaintainer.externalCompany.categories ? r.externalMaintainer.externalCompany.categories.map((c: any) => c as ReportCategory) : [],
                platformAccess: r.externalMaintainer.externalCompany.platformAccess,
              }
            }
          }
        ) : (r.externalCompany? ({
            type: 'company',
            company: {
              id: r.externalCompany.id,
              name: r.externalCompany.name,
              categories: r.externalCompany.categories ? r.externalCompany.categories.map((c: any) => c as ReportCategory) : [],
              platformAccess: r.externalCompany.platformAccess
            }
          }
        ) : null),
        messages: r.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
            senderRole: m.user?.role as Role,
        })),
        rejectedReason: r.rejectedReason ?? r.rejectionReason ?? null,
        photos: r.photos,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
