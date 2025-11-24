"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toReportDTO = toReportDTO;
function toReportDTO(r) {
    var _a, _b, _c;
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
            role: r.user.role,
            telegramUsername: (_a = r.user.telegram_username) !== null && _a !== void 0 ? _a : null,
            emailNotificationsEnabled: (_b = r.user.email_notifications_enabled) !== null && _b !== void 0 ? _b : true,
        } : undefined,
        messages: r.messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
        })),
        rejectedReason: (_c = r.rejectionReason) !== null && _c !== void 0 ? _c : null,
        photos: r.photos,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
