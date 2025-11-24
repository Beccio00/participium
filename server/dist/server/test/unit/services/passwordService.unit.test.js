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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Mock bcrypt
jest.mock("bcrypt");
const bcrypt_1 = __importDefault(require("bcrypt"));
const passwordService_1 = require("../../../src/services/passwordService");
const mockBcrypt = jest.mocked(bcrypt_1.default);
describe("passwordService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("hashPassword", () => {
        it("should generate salt and hash password", () => __awaiter(void 0, void 0, void 0, function* () {
            const plain = "password123";
            const mockSalt = "salt123";
            const mockHash = "hashed123";
            mockBcrypt.genSalt.mockResolvedValue(mockSalt);
            mockBcrypt.hash.mockResolvedValue(mockHash);
            const result = yield (0, passwordService_1.hashPassword)(plain);
            expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mockBcrypt.hash).toHaveBeenCalledWith(plain, mockSalt);
            expect(result).toEqual({ hashedPassword: mockHash, salt: mockSalt });
        }));
        it("should handle bcrypt errors in genSalt", () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("Salt error");
            mockBcrypt.genSalt.mockRejectedValue(error);
            yield expect((0, passwordService_1.hashPassword)("password")).rejects.toThrow(error);
        }));
        it("should handle bcrypt errors in hash", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSalt = "salt123";
            const error = new Error("Hash error");
            mockBcrypt.genSalt.mockResolvedValue(mockSalt);
            mockBcrypt.hash.mockRejectedValue(error);
            yield expect((0, passwordService_1.hashPassword)("password")).rejects.toThrow(error);
        }));
    });
    describe("verifyPassword", () => {
        it("should return false if dbUser is null", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, passwordService_1.verifyPassword)(null, "password");
            expect(result).toBe(false);
            expect(mockBcrypt.compare).not.toHaveBeenCalled();
        }));
        it("should return false if dbUser is undefined", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, passwordService_1.verifyPassword)(undefined, "password");
            expect(result).toBe(false);
            expect(mockBcrypt.compare).not.toHaveBeenCalled();
        }));
        it("should return false if dbUser has no password", () => __awaiter(void 0, void 0, void 0, function* () {
            const dbUser = { id: 1, email: "test@example.com" };
            const result = yield (0, passwordService_1.verifyPassword)(dbUser, "password");
            expect(result).toBe(false);
            expect(mockBcrypt.compare).not.toHaveBeenCalled();
        }));
        it("should return true if password matches", () => __awaiter(void 0, void 0, void 0, function* () {
            const dbUser = {
                id: 1,
                email: "test@example.com",
                password: "hashed",
            };
            const password = "password123";
            mockBcrypt.compare.mockResolvedValue(true);
            const result = yield (0, passwordService_1.verifyPassword)(dbUser, password);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, "hashed");
            expect(result).toBe(true);
        }));
        it("should return false if password does not match", () => __awaiter(void 0, void 0, void 0, function* () {
            const dbUser = {
                id: 1,
                email: "test@example.com",
                password: "hashed",
            };
            const password = "wrongpassword";
            mockBcrypt.compare.mockResolvedValue(false);
            const result = yield (0, passwordService_1.verifyPassword)(dbUser, password);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, "hashed");
            expect(result).toBe(false);
        }));
        it("should handle bcrypt compare errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const dbUser = {
                id: 1,
                email: "test@example.com",
                password: "hashed",
            };
            const error = new Error("Compare error");
            mockBcrypt.compare.mockRejectedValue(error);
            yield expect((0, passwordService_1.verifyPassword)(dbUser, "password")).rejects.toThrow(error);
        }));
    });
});
