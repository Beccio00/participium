"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUNICIPALITY_ROLES = exports.Roles = void 0;
exports.isValidRole = isValidRole;
exports.toUserDTO = toUserDTO;
exports.toMunicipalityUserDTO = toMunicipalityUserDTO;
exports.Roles = {
    PUBLIC_RELATIONS: "PUBLIC_RELATIONS",
    ADMINISTRATOR: "ADMINISTRATOR",
    TECHNICAL_OFFICE: "TECHNICAL_OFFICE",
    CITIZEN: "CITIZEN",
};
function isValidRole(v) {
    return Object.values(exports.Roles).includes(v);
}
function toUserDTO(u) {
    var _a, _b;
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: (Object.values(exports.Roles).includes(String(u.role)) ? u.role : String(u.role)),
        telegramUsername: (_a = u.telegram_username) !== null && _a !== void 0 ? _a : null,
        emailNotificationsEnabled: (_b = u.email_notifications_enabled) !== null && _b !== void 0 ? _b : true,
    };
}
exports.MUNICIPALITY_ROLES = [
    exports.Roles.PUBLIC_RELATIONS,
    exports.Roles.TECHNICAL_OFFICE,
];
function toMunicipalityUserDTO(u) {
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: (Object.values(exports.Roles).includes(String(u.role)) ? u.role : String(u.role)),
    };
}
