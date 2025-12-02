"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCitizenProfileDTO = toCitizenProfileDTO;
function toCitizenProfileDTO(user) {
    var _a;
    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        telegramUsername: user.telegram_username,
        emailNotificationsEnabled: user.email_notifications_enabled,
        photoUrl: ((_a = user.photo) === null || _a === void 0 ? void 0 : _a.url) || null,
    };
}
