import { Notification as PrismaNotification } from "@prisma/client";

export type NotificationDTO = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  reportId: number | null;
};

export enum NotificationType {
  REPORT_STATUS_CHANGED = "REPORT_STATUS_CHANGED",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  REPORT_ASSIGNED = "REPORT_ASSIGNED",
  REPORT_APPROVED = "REPORT_APPROVED",
  REPORT_REJECTED = "REPORT_REJECTED",
}

export function toNotificationDTO(notification: PrismaNotification): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    reportId: notification.reportId,
  };
}