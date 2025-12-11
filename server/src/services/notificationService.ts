import { NotificationRepository } from "../repositories/NotificationRepository";
import { Notification } from "../entities/Notification";
import { NotificationType } from "../../../shared/ReportTypes";
import { NotFoundError } from "../utils/errors";
import { NotificationDTO, toNotificationDTO } from "../interfaces/NotificationDTO";

const notificationRepository = new NotificationRepository();

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
  const saved = await notificationRepository.create({
    userId,
    type,
    title,
    message,
    reportId: reportId || null,
  });

  return toNotificationDTO(saved);
}

/**
 * Restituisce tutte le notifiche per un utente
 */
export async function getUserNotifications(
  userId: number,
  unreadOnly?: boolean,
  limit?: number
): Promise<NotificationDTO[]> {
  const notifications = await notificationRepository.findByUserId(userId, unreadOnly, limit);
  return notifications.map(toNotificationDTO);
}

/**
 * Segna una notifica come letta
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<NotificationDTO> {
  const notification = await notificationRepository.findById(notificationId);

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  const updatedNotification = await notificationRepository.markAsRead(notificationId);
  return toNotificationDTO(updatedNotification!);
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
 * Helper per notificare la creazione di una Internal Note tra tecnico ed esterno
 */
export async function notifyInternalNoteAdded(
  reportId: number,
  recipientUserId: number,
  authorFirstName: string,
  authorLastName: string
): Promise<void> {
  await createNotification(
    recipientUserId,
    NotificationType.INTERNAL_NOTE_RECEIVED,
    "New Internal Note",
    `${authorFirstName} ${authorLastName} added a note to report #${reportId}`,
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
