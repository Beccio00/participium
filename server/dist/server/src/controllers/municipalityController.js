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
const utils_1 = require("../utils");
function createMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { firstName, lastName, email, password, role } = req.body;
        if (!firstName || !lastName || !email || !password || !role) {
            throw new utils_1.BadRequestError("Missing required fields: firstName, lastName, email, password, role");
        }
        if (!(0, UserDTO_1.isValidRole)(role) || !UserDTO_1.MUNICIPALITY_ROLES.includes(role)) {
            throw new utils_1.BadRequestError("Invalid role. Must be one of the municipality roles");
        }
        const existingUser = yield (0, userService_1.findByEmail)(email);
        if (existingUser) {
            throw new utils_1.ConflictError("Email already in use");
        }
        const { hashedPassword, salt } = yield (0, passwordService_1.hashPassword)(password);
        const newUser = yield (0, municipalityUserService_1.createMunicipalityUser)({
            email,
            first_name: firstName,
            last_name: lastName,
            password: hashedPassword,
            salt,
            role: role
        });
        const responseUser = (0, UserDTO_1.toMunicipalityUserDTO)(newUser);
        res.status(201).json(responseUser);
    });
}
function listMunicipalityUsersController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (0, municipalityUserService_1.getAllMunicipalityUsers)();
        const responseUsers = users.map(UserDTO_1.toMunicipalityUserDTO);
        res.status(200).json(responseUsers);
    });
}
function getMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            throw new utils_1.BadRequestError("Invalid user ID format");
        }
        const user = yield (0, municipalityUserService_1.getMunicipalityUserById)(userId);
        if (!user) {
            throw new utils_1.NotFoundError("Municipality user not found");
        }
        const responseUser = (0, UserDTO_1.toMunicipalityUserDTO)(user);
        res.status(200).json(responseUser);
    });
}
function deleteMunicipalityUserController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            throw new utils_1.BadRequestError("Invalid user ID format");
        }
        const deleted = yield (0, municipalityUserService_1.deleteMunicipalityUser)(userId);
        if (!deleted) {
            throw new utils_1.NotFoundError("Municipality user not found");
        }
        res.status(204).send();
    });
}
function listRolesController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.status(200).json(UserDTO_1.MUNICIPALITY_ROLES);
    });
}
