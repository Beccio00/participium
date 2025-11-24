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
const userService_1 = require("../../../src/services/userService");
const UserDTO_1 = require("../../../src/interfaces/UserDTO");
var mockPrisma;
// Mock PrismaClient
jest.mock("../../../prisma/generated/client", () => {
    mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});
describe("userService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("findByEmail", () => {
        it("should return user if found", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = { id: 1, email: "test@example.com" };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const result = yield (0, userService_1.findByEmail)("test@example.com");
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: "test@example.com" },
            });
            expect(result).toEqual(mockUser);
        }));
        it("should return null if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const result = yield (0, userService_1.findByEmail)("notfound@example.com");
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: "notfound@example.com" },
            });
            expect(result).toBeNull();
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Database error");
            mockPrisma.user.findUnique.mockRejectedValue(error);
            yield expect((0, userService_1.findByEmail)("test@example.com")).rejects.toThrow(error);
        }));
    });
    describe("findById", () => {
        it("should return user if found", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = { id: 1, email: "test@example.com" };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const result = yield (0, userService_1.findById)(1);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockUser);
        }));
        it("should return null if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const result = yield (0, userService_1.findById)(999);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
            });
            expect(result).toBeNull();
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Database error");
            mockPrisma.user.findUnique.mockRejectedValue(error);
            yield expect((0, userService_1.findById)(1)).rejects.toThrow(error);
        }));
    });
    describe("createUser", () => {
        it("should create and return user", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "new@example.com",
                first_name: "John",
                last_name: "Doe",
                password: "hashedpass",
                salt: "salt123",
                role: UserDTO_1.Roles.CITIZEN,
                telegram_username: "johndoe",
                email_notifications_enabled: true,
            };
            const mockCreatedUser = Object.assign({ id: 1 }, userData);
            mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
            const result = yield (0, userService_1.createUser)(userData);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: "new@example.com",
                    first_name: "John",
                    last_name: "Doe",
                    password: "hashedpass",
                    salt: "salt123",
                    role: UserDTO_1.Roles.CITIZEN,
                    telegram_username: "johndoe",
                    email_notifications_enabled: true,
                },
            });
            expect(result).toEqual(mockCreatedUser);
        }));
        it("should handle optional fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "new@example.com",
                first_name: "John",
                last_name: "Doe",
                password: "hashedpass",
                salt: "salt123",
                role: UserDTO_1.Roles.CITIZEN,
            };
            const mockCreatedUser = Object.assign(Object.assign({ id: 1 }, userData), { telegram_username: null, email_notifications_enabled: undefined });
            mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
            const result = yield (0, userService_1.createUser)(userData);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: "new@example.com",
                    first_name: "John",
                    last_name: "Doe",
                    password: "hashedpass",
                    salt: "salt123",
                    role: UserDTO_1.Roles.CITIZEN,
                    telegram_username: null,
                    email_notifications_enabled: undefined,
                },
            });
            expect(result).toEqual(mockCreatedUser);
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "new@example.com",
                first_name: "John",
                last_name: "Doe",
                password: "hashedpass",
                salt: "salt123",
                role: UserDTO_1.Roles.CITIZEN,
            };
            const error = new Error("Database error");
            mockPrisma.user.create.mockRejectedValue(error);
            yield expect((0, userService_1.createUser)(userData)).rejects.toThrow(error);
        }));
    });
    describe("updateUser", () => {
        it("should update and return user", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                first_name: "Jane",
                last_name: "Smith",
                email: "jane.smith@example.com",
            };
            const mockUpdatedUser = {
                id: 1,
                email: "jane.smith@example.com",
                first_name: "Jane",
                last_name: "Smith",
                role: UserDTO_1.Roles.CITIZEN,
            };
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
            const result = yield (0, userService_1.updateUser)(1, updateData);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    email: "jane.smith@example.com",
                    first_name: "Jane",
                    last_name: "Smith",
                },
            });
            expect(result).toEqual(mockUpdatedUser);
        }));
        it("should update user with all fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                email: "updated@example.com",
                first_name: "Updated",
                last_name: "User",
                password: "newpass",
                salt: "newsalt",
                role: UserDTO_1.Roles.ADMINISTRATOR,
                telegram_username: "updateduser",
                email_notifications_enabled: false,
            };
            const mockUpdatedUser = Object.assign({ id: 1 }, updateData);
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
            const result = yield (0, userService_1.updateUser)(1, updateData);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    email: "updated@example.com",
                    first_name: "Updated",
                    last_name: "User",
                    password: "newpass",
                    salt: "newsalt",
                    role: UserDTO_1.Roles.ADMINISTRATOR,
                    telegram_username: "updateduser",
                    email_notifications_enabled: false,
                },
            });
            expect(result).toEqual(mockUpdatedUser);
        }));
        it("should handle telegram_username as null", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                telegram_username: null,
            };
            const mockUpdatedUser = { id: 1, telegram_username: null };
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
            yield (0, userService_1.updateUser)(1, updateData);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    telegram_username: null,
                },
            });
        }));
        it("should handle email_notifications_enabled as false", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                email_notifications_enabled: false,
            };
            const mockUpdatedUser = { id: 1, email_notifications_enabled: false };
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
            yield (0, userService_1.updateUser)(1, updateData);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    email_notifications_enabled: false,
                },
            });
        }));
        it("should return null on database error", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = { first_name: "Test" };
            const error = new Error("Database error");
            mockPrisma.user.update.mockRejectedValue(error);
            const result = yield (0, userService_1.updateUser)(1, updateData);
            expect(result).toBeNull();
        }));
        it("should skip undefined fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                first_name: "Test",
                email: undefined,
                password: undefined,
            };
            const mockUpdatedUser = { id: 1, first_name: "Test" };
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
            yield (0, userService_1.updateUser)(1, updateData);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    first_name: "Test",
                },
            });
        }));
    });
    describe("deleteUser", () => {
        it("should delete user and return true", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPrisma.user.delete.mockResolvedValue({});
            const result = yield (0, userService_1.deleteUser)(1);
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toBe(true);
        }));
        it("should return false on database error", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("User not found");
            mockPrisma.user.delete.mockRejectedValue(error);
            const result = yield (0, userService_1.deleteUser)(999);
            expect(result).toBe(false);
        }));
    });
    describe("findUsersByRoles", () => {
        it("should return users with specified roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUsers = [
                { id: 1, role: UserDTO_1.Roles.ADMINISTRATOR },
                { id: 2, role: UserDTO_1.Roles.PUBLIC_RELATIONS },
            ];
            mockPrisma.user.findMany.mockResolvedValue(mockUsers);
            const result = yield (0, userService_1.findUsersByRoles)([UserDTO_1.Roles.ADMINISTRATOR, UserDTO_1.Roles.PUBLIC_RELATIONS]);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    role: { in: [UserDTO_1.Roles.ADMINISTRATOR, UserDTO_1.Roles.PUBLIC_RELATIONS] },
                },
            });
            expect(result).toEqual(mockUsers);
        }));
        it("should return users with single role", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUsers = [{ id: 1, role: UserDTO_1.Roles.CITIZEN }];
            mockPrisma.user.findMany.mockResolvedValue(mockUsers);
            const result = yield (0, userService_1.findUsersByRoles)([UserDTO_1.Roles.CITIZEN]);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    role: { in: [UserDTO_1.Roles.CITIZEN] },
                },
            });
            expect(result).toEqual(mockUsers);
        }));
        it("should return empty array when no users found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPrisma.user.findMany.mockResolvedValue([]);
            const result = yield (0, userService_1.findUsersByRoles)([UserDTO_1.Roles.MUNICIPAL_BUILDING_MAINTENANCE]);
            expect(result).toEqual([]);
        }));
        it("should handle database errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Database error");
            mockPrisma.user.findMany.mockRejectedValue(error);
            yield expect((0, userService_1.findUsersByRoles)([UserDTO_1.Roles.CITIZEN])).rejects.toThrow(error);
        }));
    });
});
