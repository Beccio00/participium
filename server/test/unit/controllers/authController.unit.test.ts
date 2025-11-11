import { Request, Response, NextFunction } from "express";
import {
  login,
  logout,
  getSessionInfo,
} from "../../../src/controllers/authController";
import { authenticate, getSession } from "../../../src/services/authService";
import { InvalidCredentialsError } from "../../../src/interfaces/errors/InvalidCredentialsError";
import type { UserDTO } from "../../../src/interfaces/UserDTO";


jest.mock("../../../src/services/authService");
const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe("authController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      session: {} as any,
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
    it("should return error if already authenticated", async () => {
      mockReq.isAuthenticated.mockReturnValue(true);

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Already logged in",
      });
    });

    it("should login successfully and return user data", async () => {
      const mockUser: UserDTO = {
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
      mockReq.logIn.mockImplementation((user: any, callback: any) =>
        callback(null)
      );

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
      expect(mockReq.logIn).toHaveBeenCalledWith(
        mockUser,
        expect.any(Function)
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: mockUser,
      });
    });

    it("should handle invalid credentials", async () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      mockReq.body = { email: "wrong@example.com", password: "wrongpass" };
      const error = new InvalidCredentialsError();
      mockAuthenticate.mockRejectedValue(error);

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Invalid username or password",
      });
    });

    it("should handle login error", async () => {
      const mockUser: UserDTO = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "CITIZEN",
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };
      mockReq.isAuthenticated.mockReturnValue(false);
      mockAuthenticate.mockResolvedValue(mockUser);
      mockReq.logIn.mockImplementation((user: any, callback: any) =>
        callback(new Error("Login failed"))
      );

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error("Login failed"));
    });

    it("should handle unexpected error", async () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      const error = new Error("Unexpected error");
      mockAuthenticate.mockRejectedValue(error);

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "An unexpected error occurred",
      });
    });

    it("should proceed with login if isAuthenticated is undefined", async () => {
      const mockUser: UserDTO = { 
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
      mockReq.logIn.mockImplementation((user: any, callback: any) => callback(null));

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthenticate).toHaveBeenCalledWith(mockReq);
      expect(mockReq.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Login successful", user: mockUser });
    });
  });


  describe("logout", () => {
    it("should return error if not authenticated", () => {
      mockReq.isAuthenticated.mockReturnValue(false);

      logout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Already logged out",
      });
    });

    it("should return error if no session", () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.session = undefined;

      logout(mockReq as Request, mockRes as Response);

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
      } as any;
      mockReq.logout.mockImplementation((callback: any) =>
        callback(null)
      );

      logout(mockReq as Request, mockRes as Response);

      expect(mockReq.logout).toHaveBeenCalled();
      expect(mockReq.session.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Logged out" });
    });

    it("should handle logout error", () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.session = { destroy: jest.fn() } as any;
      const error = new Error("Logout failed");
      mockReq.logout.mockImplementation((callback: any) =>
        callback(error)
      );

      logout(mockReq as Request, mockRes as Response);

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
      } as any;
      mockReq.logout.mockImplementation((callback: any) =>
        callback(null)
      );

      logout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Logout failed",
      });
    });

    it("should return error if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;
      mockReq.session = { destroy: jest.fn((callback) => callback(null)) } as any;

      logout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Already logged out",
      });
    });

  describe("getSessionInfo", () => {
    it("should return not authenticated if no user", () => {
      mockGetSession.mockReturnValue(null);

      getSessionInfo(mockReq as Request, mockRes as Response);

      expect(mockGetSession).toHaveBeenCalledWith(mockReq);
      expect(mockRes.json).toHaveBeenCalledWith({ authenticated: false });
    });

    it("should return authenticated with user data", () => {
      const mockUser: UserDTO = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "CITIZEN",
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };
      mockGetSession.mockReturnValue(mockUser);

      getSessionInfo(mockReq as Request, mockRes as Response);

      expect(mockGetSession).toHaveBeenCalledWith(mockReq);
      expect(mockRes.json).toHaveBeenCalledWith({
        authenticated: true,
        user: mockUser,
      });
    });
  });
});
});
