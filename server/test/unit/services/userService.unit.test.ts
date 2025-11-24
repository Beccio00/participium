import {
  findByEmail,
  findById,
  createUser,
  updateUser,
  deleteUser,
  findUsersByRoles,
} from "../../../src/services/userService";
import { Roles } from "../../../src/interfaces/UserDTO";

var mockPrisma: any;

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe("userService", () => {
  beforeEach(() => {
    if (!mockPrisma) {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          findMany: jest.fn(),
        },
      };
    }
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

  describe("updateUser", () => {
    it("should update and return user", async () => {
      const updateData = {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
      };
      const mockUpdatedUser = {
        id: 1,
        email: "jane.smith@example.com",
        first_name: "Jane",
        last_name: "Smith",
        role: Roles.CITIZEN,
      } as any;
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email: "jane.smith@example.com",
          first_name: "Jane",
          last_name: "Smith",
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should update user with all fields", async () => {
      const updateData = {
        email: "updated@example.com",
        first_name: "Updated",
        last_name: "User",
        password: "newpass",
        salt: "newsalt",
        role: Roles.ADMINISTRATOR,
        telegram_username: "updateduser",
        email_notifications_enabled: false,
      };
      const mockUpdatedUser = { id: 1, ...updateData } as any;
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email: "updated@example.com",
          first_name: "Updated",
          last_name: "User",
          password: "newpass",
          salt: "newsalt",
          role: Roles.ADMINISTRATOR,
          telegram_username: "updateduser",
          email_notifications_enabled: false,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should handle telegram_username as null", async () => {
      const updateData = {
        telegram_username: null,
      };
      const mockUpdatedUser = { id: 1, telegram_username: null } as any;
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          telegram_username: null,
        },
      });
    });

    it("should handle email_notifications_enabled as false", async () => {
      const updateData = {
        email_notifications_enabled: false,
      };
      const mockUpdatedUser = {
        id: 1,
        email_notifications_enabled: false,
      } as any;
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email_notifications_enabled: false,
        },
      });
    });

    it("should return null on database error", async () => {
      const updateData = { first_name: "Test" };
      const error = new Error("Database error");
      mockPrisma.user.update.mockRejectedValue(error);

      const result = await updateUser(1, updateData);

      expect(result).toBeNull();
    });

    it("should skip undefined fields", async () => {
      const updateData = {
        first_name: "Test",
        email: undefined,
        password: undefined,
      };
      const mockUpdatedUser = { id: 1, first_name: "Test" } as any;
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          first_name: "Test",
        },
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete user and return true", async () => {
      mockPrisma.user.delete.mockResolvedValue({});

      const result = await deleteUser(1);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe(true);
    });

    it("should return false on database error", async () => {
      const error = new Error("User not found");
      mockPrisma.user.delete.mockRejectedValue(error);

      const result = await deleteUser(999);

      expect(result).toBe(false);
    });
  });

  describe("findUsersByRoles", () => {
    it("should return users with specified roles", async () => {
      const mockUsers = [
        { id: 1, role: Roles.ADMINISTRATOR },
        { id: 2, role: Roles.PUBLIC_RELATIONS },
      ] as any;
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await findUsersByRoles([
        Roles.ADMINISTRATOR,
        Roles.PUBLIC_RELATIONS,
      ]);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [Roles.ADMINISTRATOR, Roles.PUBLIC_RELATIONS] },
        },
      });
      expect(result).toEqual(mockUsers);
    });

    it("should return users with single role", async () => {
      const mockUsers = [{ id: 1, role: Roles.CITIZEN }] as any;
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await findUsersByRoles([Roles.CITIZEN]);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [Roles.CITIZEN] },
        },
      });
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array when no users found", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await findUsersByRoles([
        Roles.MUNICIPAL_BUILDING_MAINTENANCE,
      ]);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockPrisma.user.findMany.mockRejectedValue(error);

      await expect(findUsersByRoles([Roles.CITIZEN])).rejects.toThrow(error);
    });
  });
});
