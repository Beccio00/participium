"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportStatus = exports.ReportCategory = void 0;
exports.toReportDTO = toReportDTO;
const ReportTypes_1 = require("../../../shared/ReportTypes");
Object.defineProperty(exports, "ReportCategory", { enumerable: true, get: function () { return ReportTypes_1.ReportCategory; } });
Object.defineProperty(exports, "ReportStatus", { enumerable: true, get: function () { return ReportTypes_1.ReportStatus; } });
function toReportDTO(r) {
    var _a, _b, _c, _d, _e, _f;
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
            role: r.user.role,
            telegramUsername: (_a = r.user.telegram_username) !== null && _a !== void 0 ? _a : null,
            emailNotificationsEnabled: (_b = r.user.email_notifications_enabled) !== null && _b !== void 0 ? _b : true,
        } : undefined,
        assignedTo: r.assignedTo ? {
            id: r.assignedTo.id,
            firstName: r.assignedTo.first_name,
            lastName: r.assignedTo.last_name,
            email: r.assignedTo.email,
            role: r.assignedTo.role,
            telegramUsername: (_c = r.assignedTo.telegram_username) !== null && _c !== void 0 ? _c : null,
            emailNotificationsEnabled: (_d = r.assignedTo.email_notifications_enabled) !== null && _d !== void 0 ? _d : true,
        } : null,
        messages: r.messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
        })),
        rejectedReason: (_f = (_e = r.rejectedReason) !== null && _e !== void 0 ? _e : r.rejectionReason) !== null && _f !== void 0 ? _f : null,
        photos: r.photos,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
