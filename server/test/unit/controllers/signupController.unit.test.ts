import { Request, Response } from "express";
import { signup } from "../../../src/controllers/signupController";
import { findByEmail, createUser } from "../../../src/services/userService";
import { hashPassword } from "../../../src/services/passwordService";
import { toUserDTO } from "../../../src/interfaces/UserDTO";


jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
jest.mock("../../../src/interfaces/UserDTO");

const mockFindByEmail = findByEmail as jest.MockedFunction<typeof findByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockToUserDTO = toUserDTO as jest.MockedFunction<typeof toUserDTO>;

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
    const signupHandler = signup("CITIZEN");

    it("should create user successfully with all fields", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      const mockUserDTO = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "CITIZEN",
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
      mockToUserDTO.mockReturnValue(mockUserDTO);

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockHashPassword).toHaveBeenCalledWith("password123");
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN",
      });
      expect(mockToUserDTO).toHaveBeenCalledWith(mockUser);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    it("should return error if firstName is missing", async () => {
      mockReq.body = {
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Missing required fields: firstName",
      });
    });

    it("should return error if lastName is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        email: "test@example.com",
        password: "password123",
      };

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Missing required fields: lastName",
      });
    });

    it("should return error if email is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        password: "password123",
      };

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Missing required fields: email",
      });
    });

    it("should return error if password is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      };

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Missing required fields: password",
      });
    });

    it("should return error if multiple fields are missing (2 fields)", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Missing required fields: firstName, lastName",
      });
    });

    it("should return error if all fields are missing (4 fields)", async () => {
      mockReq.body = {};

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message:
          "Missing required fields: firstName, lastName, email, password",
      });
    });

    it("should return error if email already exists", async () => {
      const existingUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Existing",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
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

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Conflict",
        message: "Email already in use",
      });
    });

    it("should handle error in findByEmail", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockRejectedValue(new Error("DB error"));

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Unable to create user",
      });
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

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Unable to create user",
      });
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

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Unable to create user",
      });
    });

    it("should handle req.body undefined", async () => {
      mockReq.body = undefined;

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message:
          "Missing required fields: firstName, lastName, email, password",
      });
    });
  });
});
