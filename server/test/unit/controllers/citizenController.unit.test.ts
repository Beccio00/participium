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

describe("citizenController", () => {
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

    it("should create municipality user with PUBLIC_RELATIONS role", async () => {
      const publicRelationsHandler = signup(UserDTO.Roles.PUBLIC_RELATIONS);
      const mockUser = {
        id: 2,
        email: "pr@comune.torino.it",
        first_name: "Mario",
        last_name: "Rossi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.PUBLIC_RELATIONS as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      const mockUserDTO = {
        id: 2,
        firstName: "Mario",
        lastName: "Rossi",
        email: "pr@comune.torino.it",
        role: UserDTO.Roles.PUBLIC_RELATIONS,
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };

      mockReq.body = {
        firstName: "Mario",
        lastName: "Rossi",
        email: "pr@comune.torino.it",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockResolvedValue(mockUser);
      jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);

      await publicRelationsHandler(mockReq as Request, mockRes as Response);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "pr@comune.torino.it",
        first_name: "Mario",
        last_name: "Rossi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.PUBLIC_RELATIONS,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    it("should create municipality user with TECHNICAL_OFFICE role", async () => {
      const technicalOfficeHandler = signup(UserDTO.Roles.TECHNICAL_OFFICE);
      const mockUser = {
        id: 3,
        email: "tech@comune.torino.it",
        first_name: "Giulia",
        last_name: "Bianchi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.TECHNICAL_OFFICE as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      const mockUserDTO = {
        id: 3,
        firstName: "Giulia",
        lastName: "Bianchi",
        email: "tech@comune.torino.it",
        role: UserDTO.Roles.TECHNICAL_OFFICE,
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };

      mockReq.body = {
        firstName: "Giulia",
        lastName: "Bianchi",
        email: "tech@comune.torino.it",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockResolvedValue(mockUser);
      jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);

      await technicalOfficeHandler(mockReq as Request, mockRes as Response);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "tech@comune.torino.it",
        first_name: "Giulia",
        last_name: "Bianchi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.TECHNICAL_OFFICE,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    it("should create administrator user", async () => {
      const adminHandler = signup(UserDTO.Roles.ADMINISTRATOR);
      const mockUser = {
        id: 4,
        email: "admin@comune.torino.it",
        first_name: "Luca",
        last_name: "Verdi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.ADMINISTRATOR as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      const mockUserDTO = {
        id: 4,
        firstName: "Luca",
        lastName: "Verdi",
        email: "admin@comune.torino.it",
        role: UserDTO.Roles.ADMINISTRATOR,
        telegramUsername: null,
        emailNotificationsEnabled: true,
      };

      mockReq.body = {
        firstName: "Luca",
        lastName: "Verdi",
        email: "admin@comune.torino.it",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockResolvedValue(mockUser);
      jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);

      await adminHandler(mockReq as Request, mockRes as Response);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "admin@comune.torino.it",
        first_name: "Luca",
        last_name: "Verdi",
        password: "hashed",
        salt: "salt",
        role: UserDTO.Roles.ADMINISTRATOR,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    describe("Story 5 (PT05) - User registration for report creation", () => {
      it("should register citizen user for Story 5 report creation", async () => {
        const citizenHandler = signup(UserDTO.Roles.CITIZEN);
        const mockUser = {
          id: 5,
          email: "cittadino@example.com",
          first_name: "Anna",
          last_name: "Neri",
          password: "hashed",
          salt: "salt",
          role: UserDTO.Roles.CITIZEN as any,
          telegram_username: null,
          email_notifications_enabled: true,
        };
        const mockUserDTO = {
          id: 5,
          firstName: "Anna",
          lastName: "Neri",
          email: "cittadino@example.com",
          role: UserDTO.Roles.CITIZEN,
          telegramUsername: null,
          emailNotificationsEnabled: true,
        };

        mockReq.body = {
          firstName: "Anna",
          lastName: "Neri",
          email: "cittadino@example.com",
          password: "password123",
        };
        mockFindByEmail.mockResolvedValue(null);
        mockHashPassword.mockResolvedValue({
          hashedPassword: "hashed",
          salt: "salt",
        });
        mockCreateUser.mockResolvedValue(mockUser);
        jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue(mockUserDTO);

        await citizenHandler(mockReq as Request, mockRes as Response);

        expect(mockFindByEmail).toHaveBeenCalledWith("cittadino@example.com");
        expect(mockCreateUser).toHaveBeenCalledWith({
          email: "cittadino@example.com",
          first_name: "Anna",
          last_name: "Neri",
          password: "hashed",
          salt: "salt",
          role: UserDTO.Roles.CITIZEN,
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
      });

      it("should handle edge case with special characters in names", async () => {
        const citizenHandler = signup(UserDTO.Roles.CITIZEN);
        mockReq.body = {
          firstName: "José María",
          lastName: "O'Connor",
          email: "jose@example.com",
          password: "password123",
        };
        mockFindByEmail.mockResolvedValue(null);
        mockHashPassword.mockResolvedValue({
          hashedPassword: "hashed",
          salt: "salt",
        });
        mockCreateUser.mockResolvedValue({
          id: 6,
          email: "jose@example.com",
          first_name: "José María",
          last_name: "O'Connor",
          password: "hashed",
          salt: "salt",
          role: UserDTO.Roles.CITIZEN as any,
          telegram_username: null,
          email_notifications_enabled: true,
        });
        jest.spyOn(UserDTO, 'toUserDTO').mockReturnValue({
          id: 6,
          firstName: "José María",
          lastName: "O'Connor",
          email: "jose@example.com",
          role: UserDTO.Roles.CITIZEN,
          telegramUsername: null,
          emailNotificationsEnabled: true,
        });

        await citizenHandler(mockReq as Request, mockRes as Response);

        expect(mockCreateUser).toHaveBeenCalledWith({
          email: "jose@example.com",
          first_name: "José María",
          last_name: "O'Connor",
          password: "hashed",
          salt: "salt",
          role: UserDTO.Roles.CITIZEN,
        });
      });
    });
  });
});
