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
exports.createMunicipalityUser = createMunicipalityUser;
exports.getAllMunicipalityUsers = getAllMunicipalityUsers;
exports.getMunicipalityUserById = getMunicipalityUserById;
exports.updateMunicipalityUser = updateMunicipalityUser;
exports.deleteMunicipalityUser = deleteMunicipalityUser;
exports.findMunicipalityUserByEmail = findMunicipalityUserByEmail;
const userService_1 = require("./userService");
const UserDTO_1 = require("../interfaces/UserDTO");
function createMunicipalityUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const created = yield (0, userService_1.createUser)({
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            password: data.password,
            salt: data.salt,
            role: data.role,
            telegram_username: null,
            email_notifications_enabled: true,
        });
        return created;
    });
}
function getAllMunicipalityUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, userService_1.findUsersByRoles)(UserDTO_1.MUNICIPALITY_ROLES);
    });
}
function getMunicipalityUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield (0, userService_1.findById)(id);
        if (!user)
            return null;
        if (!UserDTO_1.MUNICIPALITY_ROLES.includes(user.role))
            return null;
        return user;
    });
}
function updateMunicipalityUser(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield getMunicipalityUserById(id);
        if (!existing)
            return null;
        const updated = yield (0, userService_1.updateUser)(id, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.email && { email: data.email })), (data.first_name && { first_name: data.first_name })), (data.last_name && { last_name: data.last_name })), (data.password && { password: data.password })), (data.salt && { salt: data.salt })), (data.role && { role: data.role })));
        return updated;
    });
}
function deleteMunicipalityUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // ensure user exists and is a municipality user
        const existing = yield getMunicipalityUserById(id);
        if (!existing)
            return false;
        return yield (0, userService_1.deleteUser)(id);
    });
}
function findMunicipalityUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield (0, userService_1.findByEmail)(email);
        if (!user)
            return null;
        if (!UserDTO_1.MUNICIPALITY_ROLES.includes(user.role))
            return null;
        return user;
    });
}
