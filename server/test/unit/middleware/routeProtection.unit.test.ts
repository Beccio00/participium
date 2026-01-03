import { Request, Response, NextFunction } from "express";
import {
  isLoggedIn,
  requireAdmin,
} from "../../../src/middlewares/routeProtection";

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

      expect(() =>
        isLoggedIn(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("You don't have the right to access this resource");

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;

      expect(() =>
        isLoggedIn(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("You don't have the right to access this resource");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is null", () => {
      mockReq.isAuthenticated = null;

      expect(() =>
        isLoggedIn(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("You don't have the right to access this resource");

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("should call next if user is authenticated and is admin", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: "ADMINISTRATOR" };

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false);

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Authentication required");

      expect(mockReq.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;
      mockReq.user = { role: "ADMINISTRATOR" };

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Authentication required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not admin", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: "CITIZEN" };

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is undefined", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = undefined;

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user is null", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = null;

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 for other municipality roles", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true);
      mockReq.user = { role: "PUBLIC_RELATIONS" };

      expect(() =>
        requireAdmin(mockReq as Request, mockRes as Response, mockNext)
      ).toThrow("Administrator privileges required");

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requirePublicRelations (unauthenticated)", () => {
    const {
      requirePublicRelations,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("forbids when not authenticated", () => {
      const req: any = {
        isAuthenticated: () => false,
        user: { role: "PUBLIC_RELATIONS" },
      };
      expect(() => requirePublicRelations(req, res, next)).toThrow(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requirePublicRelations", () => {
    const {
      requirePublicRelations,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("calls next for PUBLIC_RELATIONS", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "PUBLIC_RELATIONS" },
      };
      expect(() => requirePublicRelations(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids other roles", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "TECHNICAL_OFFICE" },
      };
      expect(() => requirePublicRelations(req, res, next)).toThrow();
    });
  });

  describe("requireCitizen", () => {
    const {
      requireCitizen,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("allows citizen", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "CITIZEN" },
      };
      expect(() => requireCitizen(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids other roles", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "ADMINISTRATOR" },
      };
      expect(() => requireCitizen(req, res, next)).toThrow(
        "Only citizens can create reports"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("requires authentication", () => {
      const req: any = { isAuthenticated: () => false };
      expect(() => requireCitizen(req, res, next)).toThrow(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("forbids when user is missing", () => {
      const req: any = { isAuthenticated: () => true, user: undefined };
      expect(() => requireCitizen(req, res, next)).toThrow(
        "Only citizens can create reports"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireTechnicalStaffOnly", () => {
    const {
      requireTechnicalStaffOnly,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("allows technical roles", () => {
      const { Role } = require("../../../src/interfaces/UserDTO");
      const req: any = {
        isAuthenticated: () => true,
        user: { role: [Role.ROAD_MAINTENANCE] },
      };
      expect(() => requireTechnicalStaffOnly(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids citizen", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "CITIZEN" },
      };
      expect(() => requireTechnicalStaffOnly(req, res, next)).toThrow();
    });
  });

  describe("requireTechnicalOrExternal (unauthenticated)", () => {
    const {
      requireTechnicalOrExternal,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("requires authentication", () => {
      const req: any = {
        isAuthenticated: () => false,
        user: { role: "EXTERNAL_MAINTAINER" },
      };
      expect(() => requireTechnicalOrExternal(req, res, next)).toThrow(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireTechnicalOrExternal", () => {
    const {
      requireTechnicalOrExternal,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("allows external maintainer", () => {
      const { Role } = require("../../../src/interfaces/UserDTO");
      const req: any = {
        isAuthenticated: () => true,
        user: { role: [Role.EXTERNAL_MAINTAINER] },
      };
      expect(() => requireTechnicalOrExternal(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids citizen", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "CITIZEN" },
      };
      expect(() => requireTechnicalOrExternal(req, res, next)).toThrow();
    });
  });

  describe("requireExternalMaintainer", () => {
    const {
      requireExternalMaintainer,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("allows external maintainer", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "EXTERNAL_MAINTAINER" },
      };
      expect(() => requireExternalMaintainer(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids other roles", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "CITIZEN" },
      };
      expect(() => requireExternalMaintainer(req, res, next)).toThrow(
        "External maintainer privileges required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("requires authentication", () => {
      const req: any = {
        isAuthenticated: () => false,
        user: { role: "EXTERNAL_MAINTAINER" },
      };
      expect(() => requireExternalMaintainer(req, res, next)).toThrow(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("forbids when user is null", () => {
      const req: any = { isAuthenticated: () => true, user: null };
      expect(() => requireExternalMaintainer(req, res, next)).toThrow(
        "External maintainer privileges required"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireCitizenOrTechnicalOrExternal", () => {
    const {
      requireCitizenOrTechnicalOrExternal,
    } = require("../../../src/middlewares/routeProtection");
    const next = jest.fn();
    const res: any = {};
    beforeEach(() => next.mockReset());

    it("allows citizen", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "CITIZEN" },
      };
      expect(() =>
        requireCitizenOrTechnicalOrExternal(req, res, next)
      ).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("allows technical", () => {
      const { Role } = require("../../../src/interfaces/UserDTO");
      const req: any = {
        isAuthenticated: () => true,
        user: { role: [Role.ROAD_MAINTENANCE] },
      };
      expect(() =>
        requireCitizenOrTechnicalOrExternal(req, res, next)
      ).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("allows external maintainer", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "EXTERNAL_MAINTAINER" },
      };
      expect(() =>
        requireCitizenOrTechnicalOrExternal(req, res, next)
      ).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it("forbids other roles", () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { role: "PUBLIC_RELATIONS" },
      };
      expect(() =>
        requireCitizenOrTechnicalOrExternal(req, res, next)
      ).toThrow();
    });
  });
});
