"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUNICIPALITY_ROLES = exports.Roles = void 0;
exports.isValidRole = isValidRole;
exports.toUserDTO = toUserDTO;
exports.toMunicipalityUserDTO = toMunicipalityUserDTO;
exports.Roles = {
    CITIZEN: "CITIZEN",
    ADMINISTRATOR: "ADMINISTRATOR",
    PUBLIC_RELATIONS: "PUBLIC_RELATIONS",
    CULTURE_EVENTS_TOURISM_SPORTS: "CULTURE_EVENTS_TOURISM_SPORTS",
    LOCAL_PUBLIC_SERVICES: "LOCAL_PUBLIC_SERVICES",
    EDUCATION_SERVICES: "EDUCATION_SERVICES",
    PUBLIC_RESIDENTIAL_HOUSING: "PUBLIC_RESIDENTIAL_HOUSING",
    INFORMATION_SYSTEMS: "INFORMATION_SYSTEMS",
    MUNICIPAL_BUILDING_MAINTENANCE: "MUNICIPAL_BUILDING_MAINTENANCE",
    PRIVATE_BUILDINGS: "PRIVATE_BUILDINGS",
    INFRASTRUCTURES: "INFRASTRUCTURES",
    GREENSPACES_AND_ANIMAL_PROTECTION: "GREENSPACES_AND_ANIMAL_PROTECTION",
    WASTE_MANAGEMENT: "WASTE_MANAGEMENT",
    ROAD_MAINTENANCE: "ROAD_MAINTENANCE",
    CIVIL_PROTECTION: "CIVIL_PROTECTION",
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
    exports.Roles.ADMINISTRATOR,
    exports.Roles.PUBLIC_RELATIONS,
    exports.Roles.CULTURE_EVENTS_TOURISM_SPORTS,
    exports.Roles.LOCAL_PUBLIC_SERVICES,
    exports.Roles.EDUCATION_SERVICES,
    exports.Roles.PUBLIC_RESIDENTIAL_HOUSING,
    exports.Roles.INFORMATION_SYSTEMS,
    exports.Roles.MUNICIPAL_BUILDING_MAINTENANCE,
    exports.Roles.PRIVATE_BUILDINGS,
    exports.Roles.INFRASTRUCTURES,
    exports.Roles.GREENSPACES_AND_ANIMAL_PROTECTION,
    exports.Roles.WASTE_MANAGEMENT,
    exports.Roles.ROAD_MAINTENANCE,
    exports.Roles.CIVIL_PROTECTION,
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
