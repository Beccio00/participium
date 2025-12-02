"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TECHNICAL_ROLES = exports.MUNICIPALITY_ROLES = exports.Role = exports.Roles = void 0;
exports.isValidRole = isValidRole;
exports.toUserDTO = toUserDTO;
exports.toMunicipalityUserDTO = toMunicipalityUserDTO;
const User_1 = require("../entities/User");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return User_1.Role; } });
exports.Roles = User_1.Role;
exports.MUNICIPALITY_ROLES = [
    User_1.Role.PUBLIC_RELATIONS,
    User_1.Role.CULTURE_EVENTS_TOURISM_SPORTS,
    User_1.Role.LOCAL_PUBLIC_SERVICES,
    User_1.Role.EDUCATION_SERVICES,
    User_1.Role.PUBLIC_RESIDENTIAL_HOUSING,
    User_1.Role.INFORMATION_SYSTEMS,
    User_1.Role.MUNICIPAL_BUILDING_MAINTENANCE,
    User_1.Role.PRIVATE_BUILDINGS,
    User_1.Role.INFRASTRUCTURES,
    User_1.Role.GREENSPACES_AND_ANIMAL_PROTECTION,
    User_1.Role.WASTE_MANAGEMENT,
    User_1.Role.ROAD_MAINTENANCE,
    User_1.Role.CIVIL_PROTECTION,
];
exports.TECHNICAL_ROLES = [
    User_1.Role.CULTURE_EVENTS_TOURISM_SPORTS,
    User_1.Role.LOCAL_PUBLIC_SERVICES,
    User_1.Role.EDUCATION_SERVICES,
    User_1.Role.PUBLIC_RESIDENTIAL_HOUSING,
    User_1.Role.INFORMATION_SYSTEMS,
    User_1.Role.MUNICIPAL_BUILDING_MAINTENANCE,
    User_1.Role.PRIVATE_BUILDINGS,
    User_1.Role.INFRASTRUCTURES,
    User_1.Role.GREENSPACES_AND_ANIMAL_PROTECTION,
    User_1.Role.WASTE_MANAGEMENT,
    User_1.Role.ROAD_MAINTENANCE,
    User_1.Role.CIVIL_PROTECTION,
];
function isValidRole(v) {
    return Object.values(User_1.Role).includes(v);
}
function toUserDTO(u) {
    var _a, _b;
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: Object.values(User_1.Role).includes(String(u.role))
            ? u.role
            : String(u.role),
        telegramUsername: (_a = u.telegram_username) !== null && _a !== void 0 ? _a : null,
        emailNotificationsEnabled: (_b = u.email_notifications_enabled) !== null && _b !== void 0 ? _b : true,
    };
}
function toMunicipalityUserDTO(u) {
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: Object.values(User_1.Role).includes(String(u.role))
            ? u.role
            : String(u.role),
    };
}
