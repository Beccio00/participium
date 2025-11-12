"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCategory = exports.ReportStatus = void 0;
exports.toReportDTO = toReportDTO;
//prisma enum are based on string, so this is a must
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    ReportStatus["ASSIGNED"] = "ASSIGNED";
    ReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ReportStatus["SUSPENDED"] = "SUSPENDED";
    ReportStatus["REJECTED"] = "REJECTED";
    ReportStatus["RESOLVED"] = "RESOLVED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportCategory;
(function (ReportCategory) {
    ReportCategory["WATER_SUPPLY_DRINKING_WATER"] = "WATER_SUPPLY_DRINKING_WATER";
    ReportCategory["ARCHITECTURAL_BARRIERS"] = "ARCHITECTURAL_BARRIERS";
    ReportCategory["SEWER_SYSTEM"] = "SEWER_SYSTEM";
    ReportCategory["PUBLIC_LIGHTING"] = "PUBLIC_LIGHTING";
    ReportCategory["WASTE"] = "WASTE";
    ReportCategory["ROAD_SIGNS_TRAFFIC_LIGHTS"] = "ROAD_SIGNS_TRAFFIC_LIGHTS";
    ReportCategory["ROADS_URBAN_FURNISHINGS"] = "ROADS_URBAN_FURNISHINGS";
    ReportCategory["PUBLIC_GREEN_AREAS_PLAYGROUNDS"] = "PUBLIC_GREEN_AREAS_PLAYGROUNDS";
    ReportCategory["OTHER"] = "OTHER";
})(ReportCategory || (exports.ReportCategory = ReportCategory = {}));
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
            role: String(r.user.role),
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
