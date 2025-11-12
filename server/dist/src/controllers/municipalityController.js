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
exports.createMunicipalityUserController = createMunicipalityUserController;
exports.listMunicipalityUsersController = listMunicipalityUsersController;
exports.getMunicipalityUserController = getMunicipalityUserController;
exports.deleteMunicipalityUserController = deleteMunicipalityUserController;
exports.listRolesController = listRolesController;
const UserDTO_1 = require("../interfaces/UserDTO");
const municipalityUserService_1 = require("../services/municipalityUserService");
const userService_1 = require("../services/userService");
const passwordService_1 = require("../services/passwordService");
function createMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, email, password, role } = req.body;
            // Validate required fields
            if (!firstName || !lastName || !email || !password || !role) {
                return res.status(400).json({
                    error: "BadRequest",
                    message: "Missing required fields: firstName, lastName, email, password, role"
                });
            }
            // Validate role
            if (!(0, UserDTO_1.isValidRole)(role) || !UserDTO_1.MUNICIPALITY_ROLES.includes(role)) {
                return res.status(400).json({
                    error: "BadRequest",
                    message: "Invalid role. Allowed: PUBLIC_RELATIONS, ADMINISTRATOR, TECHNICAL_OFFICE"
                });
            }
            // Check if email already exists (in all users)
            const existingUser = yield (0, userService_1.findByEmail)(email);
            if (existingUser) {
                return res.status(409).json({
                    error: "Conflict",
                    message: "Email already in use"
                });
            }
            // Hash password
            const { hashedPassword, salt } = yield (0, passwordService_1.hashPassword)(password);
            // Create municipality user
            const newUser = yield (0, municipalityUserService_1.createMunicipalityUser)({
                email,
                first_name: firstName,
                last_name: lastName,
                password: hashedPassword,
                salt,
                role: role
            });
            const responseUser = (0, UserDTO_1.toMunicipalityUserDTO)(newUser);
            return res.status(201).json(responseUser);
        }
        catch (error) {
            console.error("Error creating municipality user:", error);
            return res.status(500).json({
                error: "InternalServerError",
                message: "Unable to create municipality user"
            });
        }
    });
}
function listMunicipalityUsersController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, municipalityUserService_1.getAllMunicipalityUsers)();
            const responseUsers = users.map(UserDTO_1.toMunicipalityUserDTO);
            return res.status(200).json(responseUsers);
        }
        catch (error) {
            console.error("Error listing municipality users:", error);
            return res.status(500).json({
                error: "InternalServerError",
                message: "Failed to retrieve users"
            });
        }
    });
}
function getMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({
                    error: "BadRequest",
                    message: "Invalid user ID format"
                });
            }
            const user = yield (0, municipalityUserService_1.getMunicipalityUserById)(userId);
            if (!user) {
                return res.status(404).json({
                    error: "NotFound",
                    message: "Municipality user not found"
                });
            }
            const responseUser = (0, UserDTO_1.toMunicipalityUserDTO)(user);
            return res.status(200).json(responseUser);
        }
        catch (error) {
            console.error("Error getting municipality user:", error);
            return res.status(500).json({
                error: "InternalServerError",
                message: "Failed to retrieve user"
            });
        }
    });
}
function deleteMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({
                    error: "BadRequest",
                    message: "Invalid user ID format"
                });
            }
            const deleted = yield (0, municipalityUserService_1.deleteMunicipalityUser)(userId);
            if (!deleted) {
                return res.status(404).json({
                    error: "NotFound",
                    message: "Municipality user not found"
                });
            }
            return res.status(204).send();
        }
        catch (error) {
            console.error("Error deleting municipality user:", error);
            return res.status(500).json({
                error: "InternalServerError",
                message: "Failed to delete user"
            });
        }
    });
}
function listRolesController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return res.status(200).json(UserDTO_1.MUNICIPALITY_ROLES);
        }
        catch (error) {
            console.error("Error listing roles:", error);
            return res.status(500).json({
                error: "InternalServerError",
                message: "Failed to retrieve roles"
            });
        }
    });
}
