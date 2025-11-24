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
exports.findByEmail = findByEmail;
exports.findById = findById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.findUsersByRoles = findUsersByRoles;
const client_1 = require("../../prisma/generated/client");
const prisma = new client_1.PrismaClient();
function findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const u = yield prisma.user.findUnique({ where: { email } });
        if (!u)
            return null;
        return u;
    });
}
function findById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const u = yield prisma.user.findUnique({ where: { id } });
        if (!u)
            return null;
        return u;
    });
}
function createUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const created = yield prisma.user.create({
            data: {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                password: data.password,
                salt: data.salt,
                role: data.role,
                telegram_username: (_a = data.telegram_username) !== null && _a !== void 0 ? _a : null,
                email_notifications_enabled: (_b = data.email_notifications_enabled) !== null && _b !== void 0 ? _b : undefined,
            },
        });
        return created;
    });
}
function updateUser(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const updated = yield prisma.user.update({
                where: { id },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.email && { email: data.email })), (data.first_name && { first_name: data.first_name })), (data.last_name && { last_name: data.last_name })), (data.password && { password: data.password })), (data.salt && { salt: data.salt })), (data.role && { role: data.role })), (data.telegram_username !== undefined && { telegram_username: data.telegram_username })), (data.email_notifications_enabled !== undefined && { email_notifications_enabled: data.email_notifications_enabled })),
            });
            return updated;
        }
        catch (err) {
            return null;
        }
    });
}
function deleteUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.user.delete({ where: { id } });
            return true;
        }
        catch (err) {
            return false;
        }
    });
}
function findUsersByRoles(roles) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield prisma.user.findMany({
            where: {
                role: { in: roles }
            }
        });
        return users;
    });
}
