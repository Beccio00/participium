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
exports.getCitizenById = getCitizenById;
exports.updateCitizenProfile = updateCitizenProfile;
exports.uploadCitizenPhoto = uploadCitizenPhoto;
exports.deleteCitizenPhoto = deleteCitizenPhoto;
exports.getCitizenPhoto = getCitizenPhoto;
const UserRepository_1 = require("../repositories/UserRepository");
const CitizenPhotoRepository_1 = require("../repositories/CitizenPhotoRepository");
const errors_1 = require("../utils/errors");
const CitizenDTO_1 = require("../interfaces/CitizenDTO");
const userRepository = new UserRepository_1.UserRepository();
const citizenPhotoRepository = new CitizenPhotoRepository_1.CitizenPhotoRepository();
function getCitizenById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield userRepository.findWithPhoto(userId);
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        return (0, CitizenDTO_1.toCitizenProfileDTO)(user);
    });
}
function updateCitizenProfile(userId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const updateData = {};
        if (data.firstName)
            updateData.first_name = data.firstName;
        if (data.lastName)
            updateData.last_name = data.lastName;
        if (data.email)
            updateData.email = data.email;
        if (data.password)
            updateData.password = data.password;
        if (data.salt)
            updateData.salt = data.salt;
        if (data.telegramUsername !== undefined)
            updateData.telegram_username = data.telegramUsername;
        if (data.emailNotificationsEnabled !== undefined)
            updateData.email_notifications_enabled = data.emailNotificationsEnabled;
        const updatedUser = yield userRepository.update(userId, updateData);
        return (0, CitizenDTO_1.toCitizenProfileDTO)(updatedUser);
    });
}
function uploadCitizenPhoto(userId, photoUrl, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if user already has a photo
        const existingPhoto = yield citizenPhotoRepository.findByUserId(userId);
        if (existingPhoto) {
            // Update existing photo
            const updated = yield citizenPhotoRepository.updateByUserId(userId, { url: photoUrl, filename });
            return { url: updated.url, filename: updated.filename };
        }
        else {
            // Create new photo
            const created = yield citizenPhotoRepository.create({
                userId,
                url: photoUrl,
                filename,
            });
            return { url: created.url, filename: created.filename };
        }
    });
}
function deleteCitizenPhoto(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const photo = yield citizenPhotoRepository.findByUserId(userId);
        if (!photo) {
            throw new errors_1.NotFoundError("Photo not found");
        }
        yield citizenPhotoRepository.deleteByUserId(userId);
    });
}
function getCitizenPhoto(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield citizenPhotoRepository.findByUserId(userId);
    });
}
