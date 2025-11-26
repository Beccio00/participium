import { Request } from "express";
import { authenticate, getSession } from "../../../src/services/authService";
import { UnauthorizedError } from "../../../src/utils";
import passport from "passport";

jest.mock("passport");
const mockPassport = passport as jest.Mocked<typeof passport>;

describe("authService", () => {
  let mockReq: Partial<Request>;

  beforeEach(() => {
    mockReq = {};
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should resolve with user on success", async () => {
      const user = { id: 1, email: "test" };
      mockPassport.authenticate = jest.fn((authType, cb) => {
        return (req: any) => {
          cb(null, user);
        };
      }) as any;

      const result = await authenticate(mockReq as Request);
      expect(result).toBe(user);
    });

    it("should reject if passport passes error", async () => {
      mockPassport.authenticate = jest.fn((authType, cb) => {
        return (req: any) => {
          cb(new Error("Passport Error"));
        };
      }) as any;

      await expect(authenticate(mockReq as Request)).rejects.toThrow("Passport Error");
    });

    it("should reject with UnauthorizedError if user is false/null", async () => {
      mockPassport.authenticate = jest.fn((authType, cb) => {
        return (req: any) => {
          cb(null, false);
        };
      }) as any;

      await expect(authenticate(mockReq as Request)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("getSession", () => {
    it("should return user if authenticated and user exists", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true) as any;
      mockReq.user = { id: 1 } as any;
      expect(getSession(mockReq as Request)).toEqual({ id: 1 });
    });

    it("should return null if req.isAuthenticated is undefined", () => {
      mockReq.isAuthenticated = undefined;
      mockReq.user = { id: 1 } as any;
      expect(getSession(mockReq as Request)).toBeNull();
    });

    it("should return null if req.isAuthenticated() returns false", () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false) as any;
      mockReq.user = { id: 1 } as any;
      expect(getSession(mockReq as Request)).toBeNull();
    });

    it("should return null if user is undefined even if authenticated", () => {
        mockReq.isAuthenticated = jest.fn().mockReturnValue(true) as any;
        mockReq.user = undefined;
        expect(getSession(mockReq as Request)).toBeNull();
    });
  });
});