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
const authController_1 = require("../../../src/controllers/authController");
const authService_1 = require("../../../src/services/authService");
const InvalidCredentialsError_1 = require("../../../src/interfaces/errors/InvalidCredentialsError");
jest.mock("../../../src/services/authService");
const mockAuthenticate = authService_1.authenticate;
const mockGetSession = authService_1.getSession;
describe("authController", () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            body: {},
            session: {},
            isAuthenticated: jest.fn(),
            logIn: jest.fn(),
            logout: jest.fn(),
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });
    describe("login", () => {
        it("should return error if already authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.isAuthenticated.mockReturnValue(true);
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Already logged in",
            });
        }));
        it("should login successfully and return user data", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                role: "CITIZEN",
                telegramUsername: null,
                emailNotificationsEnabled: true,
            };
            mockReq.isAuthenticated.mockReturnValue(false);
            mockReq.body = { email: "test@example.com", password: "password123" };
            mockAuthenticate.mockResolvedValue(mockUser);
            mockReq.logIn.mockImplementation((user, callback) => callback(null));
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
            expect(mockReq.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Login successful",
                user: mockUser,
            });
        }));
        it("should handle invalid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.isAuthenticated.mockReturnValue(false);
            mockReq.body = { email: "wrong@example.com", password: "wrongpass" };
            const error = new InvalidCredentialsError_1.InvalidCredentialsError();
            mockAuthenticate.mockRejectedValue(error);
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Unauthorized",
                message: "Invalid username or password",
            });
        }));
        it("should handle login error", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                role: "CITIZEN",
                telegramUsername: null,
                emailNotificationsEnabled: true,
            };
            mockReq.isAuthenticated.mockReturnValue(false);
            mockAuthenticate.mockResolvedValue(mockUser);
            mockReq.logIn.mockImplementation((user, callback) => callback(new Error("Login failed")));
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(new Error("Login failed"));
        }));
        it("should handle unexpected error", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.isAuthenticated.mockReturnValue(false);
            const error = new Error("Unexpected error");
            mockAuthenticate.mockRejectedValue(error);
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "An unexpected error occurred",
            });
        }));
        it("should proceed with login if isAuthenticated is undefined", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                role: "CITIZEN",
                telegramUsername: null,
                emailNotificationsEnabled: true
            };
            mockReq.isAuthenticated = undefined;
            mockReq.body = { email: "test@example.com", password: "password123" };
            mockAuthenticate.mockResolvedValue(mockUser);
            mockReq.logIn.mockImplementation((user, callback) => callback(null));
            yield (0, authController_1.login)(mockReq, mockRes, mockNext);
            expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
            expect(mockReq.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Login successful", user: mockUser });
        }));
    });
    describe("logout", () => {
        it("should return error if not authenticated", () => {
            mockReq.isAuthenticated.mockReturnValue(false);
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Already logged out",
            });
        });
        it("should return error if no session", () => {
            mockReq.isAuthenticated.mockReturnValue(true);
            mockReq.session = undefined;
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Already logged out",
            });
        });
        it("should logout successfully", () => {
            mockReq.isAuthenticated.mockReturnValue(true);
            mockReq.session = {
                destroy: jest.fn((callback) => callback(null)),
            };
            mockReq.logout.mockImplementation((callback) => callback(null));
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockReq.logout).toHaveBeenCalled();
            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Logged out" });
        });
        it("should handle logout error", () => {
            mockReq.isAuthenticated.mockReturnValue(true);
            mockReq.session = { destroy: jest.fn() };
            const error = new Error("Logout failed");
            mockReq.logout.mockImplementation((callback) => callback(error));
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Logout failed",
            });
        });
        it("should handle session destroy error", () => {
            mockReq.isAuthenticated.mockReturnValue(true);
            const error = new Error("Session destroy failed");
            mockReq.session = {
                destroy: jest.fn((callback) => callback(error)),
            };
            mockReq.logout.mockImplementation((callback) => callback(null));
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "InternalServerError",
                message: "Logout failed",
            });
        });
        it("should return error if isAuthenticated is undefined", () => {
            mockReq.isAuthenticated = undefined;
            mockReq.session = { destroy: jest.fn((callback) => callback(null)) };
            (0, authController_1.logout)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "BadRequest",
                message: "Already logged out",
            });
        });
        describe("getSessionInfo", () => {
            it("should return not authenticated if no user", () => {
                mockGetSession.mockReturnValue(null);
                (0, authController_1.getSessionInfo)(mockReq, mockRes);
                expect(mockGetSession).toHaveBeenCalledWith(mockReq);
                expect(mockRes.json).toHaveBeenCalledWith({ authenticated: false });
            });
            it("should return authenticated with user data", () => {
                const mockUser = {
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com",
                    role: "CITIZEN",
                    telegramUsername: null,
                    emailNotificationsEnabled: true,
                };
                mockGetSession.mockReturnValue(mockUser);
                (0, authController_1.getSessionInfo)(mockReq, mockRes);
                expect(mockGetSession).toHaveBeenCalledWith(mockReq);
                expect(mockRes.json).toHaveBeenCalledWith({
                    authenticated: true,
                    user: mockUser,
                });
            });
        });
    });
});
