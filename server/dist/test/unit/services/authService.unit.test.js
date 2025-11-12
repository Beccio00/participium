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
const authService_1 = require("../../../src/services/authService");
const InvalidCredentialsError_1 = require("../../../src/interfaces/errors/InvalidCredentialsError");
const passport_1 = __importDefault(require("passport"));
// Mock passport
jest.mock("passport");
const mockPassport = passport_1.default;
describe("authService", () => {
    let mockReq;
    beforeEach(() => {
        mockReq = {};
        jest.clearAllMocks();
    });
    describe("authenticate", () => {
        it("should resolve with user on successful authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = { id: 1, email: "test@example.com" };
            const mockAuthenticate = jest.fn((strategy, callback) => {
                callback(null, mockUser);
                return (req) => { }; // mock middleware
            });
            mockPassport.authenticate = mockAuthenticate;
            const result = yield (0, authService_1.authenticate)(mockReq);
            expect(mockPassport.authenticate).toHaveBeenCalledWith("local", expect.any(Function));
            expect(result).toBe(mockUser);
        }));
        it("should reject with error if passport returns error", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockError = new Error("Auth error");
            const mockAuthenticate = jest.fn((strategy, callback) => {
                callback(mockError, false);
                return (req) => { };
            });
            mockPassport.authenticate = mockAuthenticate;
            yield expect((0, authService_1.authenticate)(mockReq)).rejects.toThrow(mockError);
        }));
        it("should reject with InvalidCredentialsError if no user", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockAuthenticate = jest.fn((strategy, callback) => {
                callback(null, false);
                return (req) => { };
            });
            mockPassport.authenticate = mockAuthenticate;
            yield expect((0, authService_1.authenticate)(mockReq)).rejects.toThrow(InvalidCredentialsError_1.InvalidCredentialsError);
        }));
    });
    describe("getSession", () => {
        it("should return user if authenticated and user exists", () => {
            const mockUser = { id: 1, email: "test@example.com" };
            mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
            mockReq.user = mockUser;
            const result = (0, authService_1.getSession)(mockReq);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(result).toBe(mockUser);
        });
        it("should return null if not authenticated", () => {
            mockReq.isAuthenticated = jest.fn().mockReturnValue(false);
            mockReq.user = { id: 1, email: "test@example.com" };
            const result = (0, authService_1.getSession)(mockReq);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(result).toBeNull();
        });
        it("should return null if isAuthenticated is undefined", () => {
            mockReq.isAuthenticated = undefined;
            mockReq.user = { id: 1, email: "test@example.com" };
            const result = (0, authService_1.getSession)(mockReq);
            expect(result).toBeNull();
        });
        it("should return null if user is undefined", () => {
            mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
            mockReq.user = undefined;
            const result = (0, authService_1.getSession)(mockReq);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(result).toBeNull();
        });
        it("should return null if user is null", () => {
            mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
            mockReq.user = null;
            const result = (0, authService_1.getSession)(mockReq);
            expect(mockReq.isAuthenticated).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});
