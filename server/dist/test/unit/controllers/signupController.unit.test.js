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
Object.defineProperty(exports, "__esModule", { value: true });
const citizenController_1 = require("../../../src/controllers/citizenController");
const userService_1 = require("../../../src/services/userService");
const passwordService_1 = require("../../../src/services/passwordService");
const UserDTO = __importStar(require("../../../src/interfaces/UserDTO"));
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
const mockFindByEmail = userService_1.findByEmail;
const mockCreateUser = userService_1.createUser;
const mockHashPassword = passwordService_1.hashPassword;
describe("signupController", () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = {
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });
    describe("signup", () => {
        const signupHandler = (0, citizenController_1.signup)(UserDTO.Roles.CITIZEN);
        it("should create user successfully with all fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                id: 1,
                email: "test@example.com",
                first_name: "Test",
                last_name: "User",
                password: "hashed",
                salt: "salt",
                role: UserDTO.Roles.CITIZEN,
                telegram_username: null,
                email_notifications_enabled: true,
            };
            const mockUserDTO = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                role: UserDTO.Roles.CITIZEN,
                telegramUsername: null,
                emailNotificationsEnabled: true,
            };
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            mockFindByEmail.mockResolvedValue(null);
            mockHashPassword.mockResolvedValue({
                hashedPassword: "hashed",
                salt: "salt",
            });
            mockCreateUser.mockResolvedValue(mockUser);
            jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);
            yield signupHandler(mockReq, mockRes);
            expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
            expect(mockHashPassword).toHaveBeenCalledWith("password123");
            expect(mockCreateUser).toHaveBeenCalledWith({
                email: "test@example.com",
                first_name: "Test",
                last_name: "User",
                password: "hashed",
                salt: "salt",
                role: UserDTO.Roles.CITIZEN,
            });
            expect(UserDTO.toUserDTO).toHaveBeenCalledWith(mockUser);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
        }));
        it("should return error if firstName is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: firstName",
            });
        }));
        it("should return error if lastName is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                email: "test@example.com",
                password: "password123",
            };
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: lastName",
            });
        }));
        it("should return error if email is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                password: "password123",
            };
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: email",
            });
        }));
        it("should return error if password is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
            };
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: password",
            });
        }));
        it("should return error if multiple fields are missing (2 fields)", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                email: "test@example.com",
                password: "password123",
            };
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: firstName, lastName",
            });
        }));
        it("should return error if all fields are missing (4 fields)", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {};
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: firstName, lastName, email, password",
            });
        }));
        it("should return error if email already exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const existingUser = {
                id: 1,
                email: "test@example.com",
                first_name: "Existing",
                last_name: "User",
                password: "hashed",
                salt: "salt",
                role: UserDTO.Roles.CITIZEN,
                telegram_username: null,
                email_notifications_enabled: true,
            };
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            mockFindByEmail.mockResolvedValue(existingUser);
            yield signupHandler(mockReq, mockRes);
            expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Conflict",
                message: "Email already in use",
            });
        }));
        it("should handle error in findByEmail", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            mockFindByEmail.mockRejectedValue(new Error("DB error"));
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Unable to create user",
            });
        }));
        it("should handle error in hashPassword", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            mockFindByEmail.mockResolvedValue(null);
            mockHashPassword.mockRejectedValue(new Error("Hash error"));
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Unable to create user",
            });
        }));
        it("should handle error in createUser", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
            };
            mockFindByEmail.mockResolvedValue(null);
            mockHashPassword.mockResolvedValue({
                hashedPassword: "hashed",
                salt: "salt",
            });
            mockCreateUser.mockRejectedValue(new Error("Create error"));
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Unable to create user",
            });
        }));
        it("should handle req.body undefined", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = undefined;
            yield signupHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Missing required fields: firstName, lastName, email, password",
            });
        }));
    });
});
