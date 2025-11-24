import { Request, Response, NextFunction } from "express";
import { isLoggedIn, requireAdmin } from "../../../src/middlewares/routeProtection";

describe("routeProtection", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("isLoggedIn", () => {
    it("should call next if user is authenticated", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);

      isLoggedIn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false);

      expect(() => isLoggedIn(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("You don't have the right to access this resource");

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;

      expect(() => isLoggedIn(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("You don't have the right to access this resource");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is null", () => {
      mockReq.isAuthenticated = null;

      expect(() => isLoggedIn(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("You don't have the right to access this resource");

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("should call next if user is authenticated and is admin", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: 'ADMINISTRATOR' };

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false);

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Authentication required");

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;
      mockReq.user = { role: 'ADMINISTRATOR' };

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Authentication required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not admin", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: 'CITIZEN' };

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is undefined", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = undefined;

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is null", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = null;

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 for other municipality roles", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: 'PUBLIC_RELATIONS' };

      expect(() => requireAdmin(mockReq as Request, mockRes as Response, mockNext))
        .toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
