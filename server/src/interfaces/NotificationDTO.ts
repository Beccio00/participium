import { Notification } from "../entities/Notification";
import { NotificationType } from "../../../shared/ReportTypes";

export { NotificationType };

export type NotificationDTO = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  reportId: number | null;
};

export function toNotificationDTO(notification: Notification): NotificationDTO {
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