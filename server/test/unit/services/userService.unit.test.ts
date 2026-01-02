import { Role } from "../../../../shared/RoleTypes";

// 创建 mock 函数
const mockFindByEmail = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFindByRoles = jest.fn();

// Mock UserRepository - 必须在 import 之前
jest.mock("../../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      findByEmail: mockFindByEmail,
      findById: mockFindById,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      findByRoles: mockFindByRoles,
    })),
  };
});

// 现在导入 service（会使用上面的 mock）
import {
  findByEmail,
  findById,
  createUser,
  updateUser,
  deleteUser,
  findUsersByRoles,
} from "../../../src/services/userService";

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1, email: "test@example.com" } as any;
      mockFindByEmail.mockResolvedValue(mockUser);

      const result = await findByEmail("test@example.com");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockFindByEmail.mockResolvedValue(null);

      const result = await findByEmail("notfound@example.com");
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      const mockUser = { id: 1 } as any;
      mockFindById.mockResolvedValue(mockUser);

      const result = await findById(1);
      expect(result).toEqual(mockUser);
    });

    it("should return null if not found", async () => {
      mockFindById.mockResolvedValue(null);

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
        role: [Role.CITIZEN],
        telegram_username: "tele",
        email_notifications_enabled: true,
      };
      const createdUser = { id: 1, ...input };
      mockCreate.mockResolvedValue(createdUser);

      const res = await createUser(input);
      expect(mockCreate).toHaveBeenCalled();
      expect(res).toEqual(createdUser);
    });

    it("should create user with optional fields defaults", async () => {
      const input = {
        email: "test@test.com",
        first_name: "T",
        last_name: "U",
        password: "p",
        salt: "s",
        role: [Role.CITIZEN],
      };
      const createdUser = {
        id: 1,
        ...input,
        telegram_username: null,
        email_notifications_enabled: true,
      };
      mockCreate.mockResolvedValue(createdUser);

      const res = await createUser(input);
      expect(mockCreate).toHaveBeenCalled();
      expect(res).toEqual(createdUser);
    });
  });

  describe("updateUser", () => {
    it("should update and return user on success", async () => {
      const updatedUser = { id: 1, first_name: "Updated" } as any;
      mockUpdate.mockResolvedValue(updatedUser);

      const res = await updateUser(1, { first_name: "Updated" });
      expect(mockUpdate).toHaveBeenCalledWith(1, { first_name: "Updated" });
      expect(res).toEqual(updatedUser);
    });

    it("should handle all optional fields in update", async () => {
      const input = {
        email: "new@mail.com",
        first_name: "F",
        last_name: "L",
        password: "p",
        salt: "s",
        role: [Role.ADMINISTRATOR],
        telegram_username: "tg",
        email_notifications_enabled: false,
      };
      const updatedUser = { id: 1, ...input };
      mockUpdate.mockResolvedValue(updatedUser);

      const res = await updateUser(1, input);
      expect(mockUpdate).toHaveBeenCalled();
      expect(res).toEqual(updatedUser);
    });

    it("should return null on database error (catch block)", async () => {
      mockUpdate.mockRejectedValue(new Error("DB Error"));

      const res = await updateUser(1, { first_name: "Fail" });
      expect(res).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should return true on successful deletion", async () => {
      mockDelete.mockResolvedValue(true);

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
    it("should call findByRoles with roles array", async () => {
      mockFindByRoles.mockResolvedValue([]);

      await findUsersByRoles([Role.CITIZEN, Role.ADMINISTRATOR]);
      expect(mockFindByRoles).toHaveBeenCalledWith([
        Role.CITIZEN,
        Role.ADMINISTRATOR,
      ]);
    });

    it("should return users matching roles", async () => {
      const mockUsers = [
        { id: 1, role: [Role.CITIZEN] },
        { id: 2, role: [Role.ADMINISTRATOR] },
      ];
      mockFindByRoles.mockResolvedValue(mockUsers);

      const res = await findUsersByRoles([Role.CITIZEN]);
      expect(res).toEqual(mockUsers);
    });
  });
});
