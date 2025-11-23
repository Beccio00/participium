import { UserDTO, Role } from './UserDTO';
import { ReportCategory, ReportStatus, ReportPhoto } from "../../../shared/ReportTypes";

export type ReportDTO = {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  address: string;
  isAnonymous: boolean;
  status: ReportStatus;
  userId: number;
  user?: UserDTO;
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
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address,
        isAnonymous: r.isAnonymous,
        status: r.status,
        userId: r.userId,
        user: r.user ? {
            id: r.user.id,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            email: r.user.email,
            role: r.user.role as Role,
            telegramUsername: r.user.telegram_username ?? null,
            emailNotificationsEnabled: r.user.email_notifications_enabled ?? true,
        } : undefined,
        messages: r.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
        })),
        rejectedReason: r.rejectionReason ?? null,
        photos: r.photos,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
