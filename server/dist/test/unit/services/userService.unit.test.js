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
});
