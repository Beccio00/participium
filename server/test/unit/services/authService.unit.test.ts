import { Request } from "express";
import { authenticate, getSession } from "../../../src/services/authService";
import { InvalidCredentialsError } from "../../../src/interfaces/errors/InvalidCredentialsError";
import passport from "passport";

// Mock passport
jest.mock("passport");
const mockPassport = passport as jest.Mocked<typeof passport>;

describe("authService", () => {
  let mockReq: any;

  beforeEach(() => {
    mockReq = {};
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should resolve with user on successful authentication", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      const mockAuthenticate = jest.fn((strategy, callback) => {
        callback(null, mockUser);
        return (req: Request) => {}; // mock middleware
      });
      mockPassport.authenticate = mockAuthenticate;

      const result = await authenticate(mockReq as Request);

      expect(mockPassport.authenticate).toHaveBeenCalledWith(
        "local",
        expect.any(Function)
      );
      expect(result).toBe(mockUser);
    });

    it("should reject with error if passport returns error", async () => {
      const mockError = new Error("Auth error");
      const mockAuthenticate = jest.fn((strategy, callback) => {
        callback(mockError, false);
        return (req: Request) => {};
      });
      mockPassport.authenticate = mockAuthenticate;

      await expect(authenticate(mockReq as Request)).rejects.toThrow(mockError);
    });

    it("should reject with InvalidCredentialsError if no user", async () => {
      const mockAuthenticate = jest.fn((strategy, callback) => {
        callback(null, false);
        return (req: Request) => {};
      });
      mockPassport.authenticate = mockAuthenticate;

      await expect(authenticate(mockReq as Request)).rejects.toThrow(
        InvalidCredentialsError
      );
    });
  });

  describe("getSession", () => {
    it("should return user if authenticated and user exists", () => {
      const mockUser = { id: 1, email: "test@example.com" };
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = mockUser;

      const result = getSession(mockReq as Request);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it("should return null if not authenticated", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false);
      mockReq.user = { id: 1, email: "test@example.com" };

      const result = getSession(mockReq as Request);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;
      mockReq.user = { id: 1, email: "test@example.com" };

      const result = getSession(mockReq as Request);

      expect(result).toBeNull();
    });

    it("should return null if user is undefined", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = undefined;

      const result = getSession(mockReq as Request);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if user is null", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = null;

      const result = getSession(mockReq as Request);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
