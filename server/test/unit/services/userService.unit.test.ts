import {
  findByEmail,
  findById,
  createUser,
} from "../../../src/services/userService";
import { Roles } from "../../../src/interfaces/UserDTO";

var mockPrisma: any;

// Mock PrismaClient
jest.mock("../../../prisma/generated/client", () => {
  mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1, email: "test@example.com" } as any;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await findByEmail("test@example.com");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await findByEmail("notfound@example.com");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "notfound@example.com" },
      });
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await expect(findByEmail("test@example.com")).rejects.toThrow(error);
    });
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1, email: "test@example.com" } as any;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await findById(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await findById(999);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await expect(findById(1)).rejects.toThrow(error);
    });
  });

  describe("createUser", () => {
    it("should create and return user", async () => {
      const userData = {
        email: "new@example.com",
        first_name: "John",
        last_name: "Doe",
        password: "hashedpass",
        salt: "salt123",
        role: Roles.CITIZEN,
        telegram_username: "johndoe",
        email_notifications_enabled: true,
      };
      const mockCreatedUser = { id: 1, ...userData } as any;
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          first_name: "John",
          last_name: "Doe",
          password: "hashedpass",
          salt: "salt123",
          role: Roles.CITIZEN as any,
          telegram_username: "johndoe",
          email_notifications_enabled: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it("should handle optional fields", async () => {
      const userData = {
        email: "new@example.com",
        first_name: "John",
        last_name: "Doe",
        password: "hashedpass",
        salt: "salt123",
        role: Roles.CITIZEN,
      };
      const mockCreatedUser = {
        id: 1,
        ...userData,
        telegram_username: null,
        email_notifications_enabled: undefined,
      } as any;
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          first_name: "John",
          last_name: "Doe",
          password: "hashedpass",
          salt: "salt123",
          role: Roles.CITIZEN as any,
          telegram_username: null,
          email_notifications_enabled: undefined,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it("should handle database errors", async () => {
      const userData = {
        email: "new@example.com",
        first_name: "John",
        last_name: "Doe",
        password: "hashedpass",
        salt: "salt123",
        role: Roles.CITIZEN,
      };
      const error = new Error("Database error");
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(createUser(userData)).rejects.toThrow(error);
    });
  });
});
