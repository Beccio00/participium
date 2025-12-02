"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.notifyReportStatusChange = notifyReportStatusChange;
exports.notifyNewMessage = notifyNewMessage;
exports.notifyReportAssigned = notifyReportAssigned;
exports.notifyReportApproved = notifyReportApproved;
exports.notifyReportRejected = notifyReportRejected;
const NotificationRepository_1 = require("../repositories/NotificationRepository");
const Notification_1 = require("../entities/Notification");
const errors_1 = require("../utils/errors");
const NotificationDTO_1 = require("../interfaces/NotificationDTO");
const notificationRepository = new NotificationRepository_1.NotificationRepository();
/**
 * Crea una notifica per un utente
 */
function createNotification(userId, type, title, message, reportId) {
    return __awaiter(this, void 0, void 0, function* () {
        const saved = yield notificationRepository.create({
            userId,
            type,
            title,
            message,
            reportId: reportId || null,
        });
        return (0, NotificationDTO_1.toNotificationDTO)(saved);
    });
}
/**
 * Restituisce tutte le notifiche per un utente
 */
function getUserNotifications(userId, unreadOnly, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const notifications = yield notificationRepository.findByUserId(userId, unreadOnly, limit);
        return notifications.map(NotificationDTO_1.toNotificationDTO);
    });
}
/**
 * Segna una notifica come letta
 */
function markNotificationAsRead(notificationId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notification = yield notificationRepository.findById(notificationId);
        if (!notification) {
            throw new errors_1.NotFoundError("Notification not found");
        }
        const updatedNotification = yield notificationRepository.markAsRead(notificationId);
        return (0, NotificationDTO_1.toNotificationDTO)(updatedNotification);
    });
}
/**
 * Helper per creare una notifica quando lo stato del report cambia
 */
function notifyReportStatusChange(reportId, userId, oldStatus, newStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNotification(userId, Notification_1.NotificationType.REPORT_STATUS_CHANGED, "Report Status Updated", `Your report status has been changed from ${oldStatus} to ${newStatus}`, reportId);
    });
}
/**
 * Helper per creare una notifica quando viene ricevuto un nuovo messaggio
 */
function notifyNewMessage(reportId, userId, senderName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNotification(userId, Notification_1.NotificationType.MESSAGE_RECEIVED, "New Message Received", `${senderName} has sent you a message regarding your report`, reportId);
    });
}
/**
 * Helper per creare una notifica quando un report viene assegnato
 */
function notifyReportAssigned(reportId, technicalUserId, reportTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNotification(technicalUserId, Notification_1.NotificationType.REPORT_ASSIGNED, "New Report Assigned", `You have been assigned to work on: ${reportTitle}`, reportId);
    });
}
/**
 * Helper per creare una notifica quando un report viene approvato
 */
function notifyReportApproved(reportId, userId, reportTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNotification(userId, Notification_1.NotificationType.REPORT_APPROVED, "Report Approved", `Your report "${reportTitle}" has been approved and assigned to a technical officer`, reportId);
    });
}
/**
 * Helper per creare una notifica quando un report viene rifiutato
 */
function notifyReportRejected(reportId, userId, reportTitle, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNotification(userId, Notification_1.NotificationType.REPORT_REJECTED, "Report Rejected", `Your report "${reportTitle}" has been rejected. Reason: ${reason}`, reportId);
    });
}
