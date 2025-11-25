import { UserDTO, Role } from './UserDTO';
import { ReportCategory, ReportStatus, ReportPhoto } from "../../../shared/ReportTypes";

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
  assignedTo?: UserDTO | null;
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
        status: r.status,
        user: r.user ? {
            id: r.user.id,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            email: r.user.email,
            role: r.user.role as Role,
            telegramUsername: r.user.telegram_username ?? null,
            emailNotificationsEnabled: r.user.email_notifications_enabled ?? true,
        } : undefined,
        assignedTo: r.assignedTo ? {
            id: r.assignedTo.id,
            firstName: r.assignedTo.first_name,
            lastName: r.assignedTo.last_name,
            email: r.assignedTo.email,
            role: r.assignedTo.role as Role,
            telegramUsername: r.assignedTo.telegram_username ?? null,
            emailNotificationsEnabled: r.assignedTo.email_notifications_enabled ?? true,
        } : null,
        messages: r.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
        })),
        rejectedReason: r.rejectedReason ?? r.rejectionReason ?? null,
        photos: r.photos,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
