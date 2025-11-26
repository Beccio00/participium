import {
  findByEmail,
  findById,
  createUser,
  updateUser,
  deleteUser,
  findUsersByRoles,
} from "../../../src/services/userService";
import { Roles } from "../../../src/interfaces/UserDTO";
import { PrismaClient } from "@prisma/client";

// Mock @prisma/client
jest.mock("@prisma/client", () => {
  const mUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      user: mUser,
    })),
  };
});

describe("userService", () => {
  // Get access to the shared mocks via a new instance (which returns the singleton mock structure)
  const prismaMock = new PrismaClient();
  const mockFindUnique = prismaMock.user.findUnique as jest.Mock;
  const mockCreate = prismaMock.user.create as jest.Mock;
  const mockUpdate = prismaMock.user.update as jest.Mock;
  const mockDelete = prismaMock.user.delete as jest.Mock;
  const mockFindMany = prismaMock.user.findMany as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      mockFindUnique.mockResolvedValue(mockUser);
      const result = await findByEmail("test@example.com");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await findByEmail("notfound@example.com");
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1 };
      mockFindUnique.mockResolvedValue(mockUser);
      const result = await findById(1);
      expect(result).toEqual(mockUser);
    });

    it("should return null if not found", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await findById(999);
      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should create user with all fields", async () => {
      const input = {
        email: "test@test.com",
        first_name: "T",
        last_name: "U",
        password: "p",
        salt: "s",
        role: Roles.CITIZEN,
        telegram_username: "tele",
        email_notifications_enabled: true,
      };
      mockCreate.mockResolvedValue({ id: 1, ...input });

      const res = await createUser(input);
      expect(mockCreate).toHaveBeenCalledWith({ data: input });
      expect(res).toEqual({ id: 1, ...input });
    });

    it("should create user with optional fields defaults", async () => {
      const input = {
        email: "test@test.com",
        first_name: "T",
        last_name: "U",
        password: "p",
        salt: "s",
        role: Roles.CITIZEN,
      };
      mockCreate.mockResolvedValue({ id: 1, ...input });

      await createUser(input);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          ...input,
          telegram_username: null,
          email_notifications_enabled: undefined,
        },
      });
    });
  });

  describe("updateUser", () => {
    it("should update and return user on success", async () => {
      const input = { first_name: "Updated" };
      mockUpdate.mockResolvedValue({ id: 1, ...input });

      const res = await updateUser(1, input);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { first_name: "Updated" },
      });
      expect(res).toEqual({ id: 1, ...input });
    });

    it("should handle all optional fields in update", async () => {
      const input = {
        email: "new@mail.com",
        first_name: "F",
        last_name: "L",
        password: "p",
        salt: "s",
        role: Roles.ADMINISTRATOR,
        telegram_username: "tg",
        email_notifications_enabled: false,
      };
      mockUpdate.mockResolvedValue({ id: 1 });

      await updateUser(1, input);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
      });
    });

    it("should return null on database error (catch block)", async () => {
      mockUpdate.mockRejectedValue(new Error("DB Error"));
      const res = await updateUser(1, { first_name: "Fail" });
      expect(res).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should return true on successful deletion", async () => {
      mockDelete.mockResolvedValue({ id: 1 });
      const res = await deleteUser(1);
      expect(res).toBe(true);
    });

    it("should return false on database error (catch block)", async () => {
      mockDelete.mockRejectedValue(new Error("DB Error"));
      const res = await deleteUser(1);
      expect(res).toBe(false);
    });
  });

  describe("findUsersByRoles", () => {
    it("should call findMany with in operator", async () => {
      mockFindMany.mockResolvedValue([]);
      await findUsersByRoles([Roles.CITIZEN, Roles.ADMINISTRATOR]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { role: { in: [Roles.CITIZEN, Roles.ADMINISTRATOR] } },
      });
    });
  });
});