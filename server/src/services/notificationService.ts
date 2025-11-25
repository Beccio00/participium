import { prisma } from "../utils/prismaClient";
import { NotFoundError } from "../utils/errors";
import { NotificationDTO, NotificationType, toNotificationDTO } from "../interfaces/NotificationDTO";

/**
 * Crea una notifica per un utente
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  reportId?: number
): Promise<NotificationDTO> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      reportId: reportId || null,
    },
  });

  return toNotificationDTO(notification);
}

/**
 * Restituisce tutte le notifiche per un utente
 */
export async function getUserNotifications(
  userId: number,
  unreadOnly?: boolean,
  limit?: number
): Promise<NotificationDTO[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return notifications.map(toNotificationDTO);
}

/**
 * Segna una notifica come letta
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<NotificationDTO> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return toNotificationDTO(updatedNotification);
}

/**
 * Helper per creare una notifica quando lo stato del report cambia
 */
export async function notifyReportStatusChange(
  reportId: number,
  userId: number,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await createNotification(
    userId,
    NotificationType.REPORT_STATUS_CHANGED,
    "Report Status Updated",
    `Your report status has been changed from ${oldStatus} to ${newStatus}`,
    reportId
  );
}

/**
 * Helper per creare una notifica quando viene ricevuto un nuovo messaggio
 */
export async function notifyNewMessage(
  reportId: number,
  userId: number,
  senderName: string
): Promise<void> {
  await createNotification(
    userId,
    NotificationType.MESSAGE_RECEIVED,
    "New Message Received",
    `${senderName} has sent you a message regarding your report`,
    reportId
  );
}

/**
 * Helper per creare una notifica quando un report viene assegnato
 */
export async function notifyReportAssigned(
  reportId: number,
  technicalUserId: number,
  reportTitle: string
): Promise<void> {
  await createNotification(
    technicalUserId,
    NotificationType.REPORT_ASSIGNED,
    "New Report Assigned",
    `You have been assigned to work on: ${reportTitle}`,
    reportId
  );
}

/**
 * Helper per creare una notifica quando un report viene approvato
 */
export async function notifyReportApproved(
  reportId: number,
  userId: number,
  reportTitle: string
): Promise<void> {
  await createNotification(
    userId,
    NotificationType.REPORT_APPROVED,
    "Report Approved",
    `Your report "${reportTitle}" has been approved and assigned to a technical officer`,
    reportId
  );
}

/**
 * Helper per creare una notifica quando un report viene rifiutato
 */
export async function notifyReportRejected(
  reportId: number,
  userId: number,
  reportTitle: string,
  reason: string
): Promise<void> {
  await createNotification(
    userId,
    NotificationType.REPORT_REJECTED,
    "Report Rejected",
    `Your report "${reportTitle}" has been rejected. Reason: ${reason}`,
    reportId
  );
}
