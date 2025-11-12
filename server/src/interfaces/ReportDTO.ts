import { UserDTO } from './UserDTO';


export type ReportDTO = {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
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

export type ReportPhoto = {
  id: number;
  url: string;
  filename: string;
};

export type ReportMessageDTO = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
};

//prisma enum are based on string, so this is a must
export enum ReportStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    SUSPENDED = "SUSPENDED",
    REJECTED = "REJECTED",
    RESOLVED = "RESOLVED"
}

export enum ReportCategory {
    WATER_SUPPLY_DRINKING_WATER = "WATER_SUPPLY_DRINKING_WATER",
    ARCHITECTURAL_BARRIERS = "ARCHITECTURAL_BARRIERS",
    SEWER_SYSTEM = "SEWER_SYSTEM",
    PUBLIC_LIGHTING = "PUBLIC_LIGHTING",
    WASTE = "WASTE",
    ROAD_SIGNS_TRAFFIC_LIGHTS = "ROAD_SIGNS_TRAFFIC_LIGHTS",
    ROADS_URBAN_FURNISHINGS = "ROADS_URBAN_FURNISHINGS",
    PUBLIC_GREEN_AREAS_PLAYGROUNDS = "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
    OTHER = "OTHER"
}

export function toReportDTO(r: any): ReportDTO {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        latitude: r.latitude,
        longitude: r.longitude,
        isAnonymous: r.isAnonymous,
        status: r.status,
        userId: r.userId,
        user: r.user ? {
            id: r.user.id,
            firstName: r.user.first_name,
            lastName: r.user.last_name,
            email: r.user.email,
            role: String(r.user.role),
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
