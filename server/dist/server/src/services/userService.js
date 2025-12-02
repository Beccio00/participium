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
const UserRepository_1 = require("../repositories/UserRepository");
const userRepository = new UserRepository_1.UserRepository();
function findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield userRepository.findByEmail(email);
    });
}
function findById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield userRepository.findById(id);
    });
}
function createUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        return yield userRepository.create({
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            password: data.password,
            salt: data.salt,
            role: data.role,
            telegram_username: (_a = data.telegram_username) !== null && _a !== void 0 ? _a : null,
            email_notifications_enabled: (_b = data.email_notifications_enabled) !== null && _b !== void 0 ? _b : true,
        });
    });
}
function updateUser(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create a clean update object
            const updateData = {};
            if (data.email !== undefined)
                updateData.email = data.email;
            if (data.first_name !== undefined)
                updateData.first_name = data.first_name;
            if (data.last_name !== undefined)
                updateData.last_name = data.last_name;
            if (data.password !== undefined)
                updateData.password = data.password;
            if (data.salt !== undefined)
                updateData.salt = data.salt;
            if (data.role !== undefined)
                updateData.role = data.role;
            if (data.telegram_username !== undefined)
                updateData.telegram_username = data.telegram_username;
            if (data.email_notifications_enabled !== undefined)
                updateData.email_notifications_enabled = data.email_notifications_enabled;
            return yield userRepository.update(id, updateData);
        }
        catch (err) {
            return null;
        }
    });
}
function deleteUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield userRepository.delete(id);
        }
        catch (err) {
            return false;
        }
    });
}
function findUsersByRoles(roles) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield userRepository.findByRoles(roles);
    });
}
