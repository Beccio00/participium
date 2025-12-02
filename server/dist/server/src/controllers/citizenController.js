"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.getCitizenProfile = getCitizenProfile;
exports.updateCitizenProfile = updateCitizenProfile;
exports.uploadCitizenPhoto = uploadCitizenPhoto;
exports.deleteCitizenPhoto = deleteCitizenPhoto;
const path_1 = __importDefault(require("path"));
const userService_1 = require("../services/userService");
const passwordService_1 = require("../services/passwordService");
const UserDTO_1 = require("../interfaces/UserDTO");
const utils_1 = require("../utils");
const citizenService_1 = require("../services/citizenService");
const minioClient_1 = __importStar(require("../utils/minioClient"));
function signup(role) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { firstName, lastName, email, password } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
            if (!firstName || !lastName || !email || !password) {
                const missedFields = [];
                if (!firstName)
                    missedFields.push('firstName');
                if (!lastName)
                    missedFields.push('lastName');
                if (!email)
                    missedFields.push('email');
                if (!password)
                    missedFields.push('password');
                throw new utils_1.BadRequestError(`Missing required fields: ${missedFields.join(', ')}`);
            }
            if (!(0, UserDTO_1.isValidRole)(role)) {
                throw new utils_1.BadRequestError('Invalid role');
            }
            const existing = yield (0, userService_1.findByEmail)(email);
            if (existing) {
                throw new utils_1.ConflictError('Email already in use');
            }
            const { hashedPassword, salt } = yield (0, passwordService_1.hashPassword)(password);
            const created = yield (0, userService_1.createUser)({
                email,
                first_name: firstName,
                last_name: lastName,
                password: hashedPassword,
                salt,
                role: role
            });
            res.status(201).json((0, UserDTO_1.toUserDTO)(created));
        });
    };
}
function getCitizenProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const profile = yield (0, citizenService_1.getCitizenById)(user.id);
        res.status(200).json(profile);
    });
}
function updateCitizenProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const { firstName, lastName, email, password, telegramUsername, emailNotificationsEnabled } = req.body;
        // Almeno un campo deve essere presente
        if (firstName === undefined &&
            lastName === undefined &&
            email === undefined &&
            password === undefined &&
            telegramUsername === undefined &&
            emailNotificationsEnabled === undefined) {
            throw new utils_1.BadRequestError('At least one field must be provided');
        }
        let hashedPassword;
        let salt;
        // Se l'utente vuole cambiare email, controlla che non sia già usata da un altro
        if (email) {
            const existing = yield (0, userService_1.findByEmail)(email);
            if (existing && existing.id !== user.id) {
                throw new utils_1.ConflictError('Email already in use');
            }
        }
        if (password) {
            const hashed = yield (0, passwordService_1.hashPassword)(password);
            hashedPassword = hashed.hashedPassword;
            salt = hashed.salt;
        }
        const updatedProfile = yield (0, citizenService_1.updateCitizenProfile)(user.id, {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            salt,
            telegramUsername,
            emailNotificationsEnabled,
        });
        res.status(200).json(updatedProfile);
    });
}
function uploadCitizenPhoto(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const photos = req.files;
        if (!photos || photos.length === 0) {
            throw new utils_1.BadRequestError('Photo file is required');
        }
        if (photos.length > 1) {
            throw new utils_1.BadRequestError('Only one photo allowed');
        }
        const photo = photos[0];
        // Delete old photo from MinIO if exists
        const existingPhoto = yield (0, citizenService_1.getCitizenPhoto)(user.id);
        if (existingPhoto) {
            try {
                yield minioClient_1.default.removeObject(minioClient_1.BUCKET_NAME, existingPhoto.filename);
            }
            catch (error) {
                console.error('Failed to delete old photo from MinIO:', error);
            }
        }
        // Upload new photo to MinIO
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `citizen-${user.id}-${uniqueSuffix}${path_1.default.extname(photo.originalname)}`;
        yield minioClient_1.default.putObject(minioClient_1.BUCKET_NAME, filename, photo.buffer, photo.size, {
            'Content-Type': photo.mimetype,
        });
        const url = (0, minioClient_1.getMinioObjectUrl)(filename);
        // Save to database
        const savedPhoto = yield (0, citizenService_1.uploadCitizenPhoto)(user.id, url, filename);
        const response = {
            message: 'Photo uploaded successfully',
            photo: {
                id: 0,
                url: savedPhoto.url,
                filename: savedPhoto.filename,
            },
        };
        res.status(201).json(response);
    });
}
function deleteCitizenPhoto(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const photo = yield (0, citizenService_1.getCitizenPhoto)(user.id);
        if (!photo) {
            throw new utils_1.NotFoundError('Photo not found');
        }
        try {
            yield minioClient_1.default.removeObject(minioClient_1.BUCKET_NAME, photo.filename);
        }
        catch (error) {
            console.error('Failed to delete photo from MinIO:', error);
        }
        yield (0, citizenService_1.deleteCitizenPhoto)(user.id);
        res.status(204).send();
    });
}
