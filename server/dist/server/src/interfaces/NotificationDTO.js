"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
exports.toNotificationDTO = toNotificationDTO;
const Notification_1 = require("../entities/Notification");
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return Notification_1.NotificationType; } });
function toNotificationDTO(notification) {
    return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        reportId: notification.reportId,
    };
}
