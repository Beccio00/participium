import { Request, Response } from "express";
import { signup } from "../../../src/controllers/citizenController";
import { findByEmail, createUser } from "../../../src/services/userService";
import { hashPassword } from "../../../src/services/passwordService";
import * as UserDTO from "../../../src/interfaces/UserDTO";
import { BadRequestError, ConflictError } from "../../../src/utils";


jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
const mockFindByEmail = findByEmail as jest.MockedFunction<typeof findByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;

describe("signupController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("signup", () => {
    const signupHandler = signup(UserDTO.Roles.CITIZEN);

    it("should create user successfully with all fields", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.CITIZEN as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      const mockUserDTO = {
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: UserDTO.Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };

      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockResolvedValue(mockUser);
      jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockHashPassword).toHaveBeenCalledWith("password123");
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.CITIZEN,
      });
      expect(UserDTO.toUserDTO).toHaveBeenCalledWith(mockUser);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    it("should return error if firstName is missing", async () => {
      mockReq.body = {
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if lastName is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        email: "test@example.com",
        password: "password123",
      };

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if email is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        password: "password123",
      };

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if password is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      };

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if multiple fields are missing (2 fields)", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if all fields are missing (4 fields)", async () => {
      mockReq.body = {};

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if email already exists", async () => {
      const existingUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Existing",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.CITIZEN as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };

      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(existingUser);

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(ConflictError);
    });

    it("should handle error in findByEmail", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockRejectedValue(new Error("DB error"));

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });

    it("should handle error in hashPassword", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockRejectedValue(new Error("Hash error"));

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });

    it("should handle error in createUser", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockRejectedValue(new Error("Create error"));

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });

    it("should handle req.body undefined", async () => {
      mockReq.body = undefined;

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle invalid role", async () => {
      const invalidSignupHandler = signup('INVALID_ROLE' as any);
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };

      await expect(
        invalidSignupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });
});
