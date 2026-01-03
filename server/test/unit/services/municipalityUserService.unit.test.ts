import { Role } from "../../../../shared/RoleTypes";
import { BadRequestError } from "../../../src/utils";

// Create mock functions for UserRepository
const mockCountByRole = jest.fn();
const mockUpdate = jest.fn();
const mockFindByRoles = jest.fn();

// Mock UserRepository BEFORE imports
jest.mock("../../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      countByRole: mockCountByRole,
      update: mockUpdate,
      findByRoles: mockFindByRoles,
    })),
  };
});

// Mock userService
const mockCreateUser = jest.fn();
const mockFindById = jest.fn();
const mockFindByEmail = jest.fn();
const mockUpdateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockFindUsersByRoles = jest.fn();

jest.mock("../../../src/services/userService", () => ({
  createUser: function () {
    return mockCreateUser.apply(this, arguments);
  },
  findById: function () {
    return mockFindById.apply(this, arguments);
  },
  findByEmail: function () {
    return mockFindByEmail.apply(this, arguments);
  },
  updateUser: function () {
    return mockUpdateUser.apply(this, arguments);
  },
  deleteUser: function () {
    return mockDeleteUser.apply(this, arguments);
  },
  findUsersByRoles: function () {
    return mockFindUsersByRoles.apply(this, arguments);
  },
}));

// Mock UserDTO to ensure ADMINISTRATOR is considered a municipality role
jest.mock("../../../src/interfaces/UserDTO", () => {
  const original = jest.requireActual("../../../src/interfaces/UserDTO");
  return {
    ...original,
    MUNICIPALITY_ROLES: [
      "ADMINISTRATOR",
      "PUBLIC_RELATIONS",
      "MUNICIPAL_BUILDING_MAINTENANCE",
    ],
  };
});

// Import services after mocks
import {
  createMunicipalityUser,
  getAllMunicipalityUsers,
  getMunicipalityUserById,
  updateMunicipalityUser,
  deleteMunicipalityUser,
  findMunicipalityUserByEmail,
} from "../../../src/services/municipalityUserService";

describe("municipalityUserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMunicipalityUser", () => {
    it("should delegate to userService.createUser", async () => {
      const data = {
        email: "e",
        first_name: "f",
        last_name: "l",
        password: "p",
        salt: "s",
        role: [Role.PUBLIC_RELATIONS],
      };
      mockCreateUser.mockResolvedValue({ id: 1 });
      mockUpdate.mockResolvedValue({ id: 1, isVerified: true });
      await createMunicipalityUser(data);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "e",
          role: [Role.PUBLIC_RELATIONS],
          email_notifications_enabled: true,
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith(1, { isVerified: true });
    });
  });

  describe("getAllMunicipalityUsers", () => {
    it("should delegate to findUsersByRoles", async () => {
      mockFindUsersByRoles.mockResolvedValue([]);
    });
  });

  describe("getMunicipalityUserById", () => {
    it("should return null if user not found", async () => {
      mockFindById.mockResolvedValue(null);
      const res = await getMunicipalityUserById(1);
      expect(res).toBeNull();
    });

    it("should return null if user role is not municipality", async () => {
      mockFindById.mockResolvedValue({
        id: 1,
        role: [Role.CITIZEN],
      });
      const res = await getMunicipalityUserById(1);
      expect(res).toBeNull();
    });

    it("should return user if valid role", async () => {
      const user = { id: 1, role: [Role.MUNICIPAL_BUILDING_MAINTENANCE] };
      mockFindById.mockResolvedValue(user);
      const res = await getMunicipalityUserById(1);
      expect(res).toEqual(user);
    });
  });

  describe("updateMunicipalityUser", () => {
    it("should return null if user validation fails", async () => {
      mockFindById.mockResolvedValue(null);
      const res = await updateMunicipalityUser(1, {});
      expect(res).toBeNull();
    });

    it("should call updateUser with mapped fields", async () => {
      const user = { id: 1, role: [Role.PUBLIC_RELATIONS] };
      mockFindById.mockResolvedValue(user);
      mockUpdateUser.mockResolvedValue({
        ...user,
        first_name: "New",
      });

      const res = await updateMunicipalityUser(1, { first_name: "New" });
      expect(mockUpdateUser).toHaveBeenCalledWith(1, {
        first_name: "New",
      });
      expect(res).toEqual({ ...user, first_name: "New" });
    });
  });

  describe("deleteMunicipalityUser", () => {
    it("should return false if user doesn't exist", async () => {
      const user = { id: 1, role: [Role.PUBLIC_RELATIONS] };
      const res = await deleteMunicipalityUser(1);
      expect(res).toBe(false);
    });

    it("should throw BadRequestError if trying to delete the last administrator", async () => {
      mockFindById.mockResolvedValue({
        id: 1,
        role: [Role.ADMINISTRATOR],
      });
      mockFindByRoles.mockResolvedValue([
        { id: 1, role: [Role.ADMINISTRATOR] },
      ]);

      await expect(deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
    });

    it("should allow deleting administrator if others exist", async () => {
      mockFindById.mockResolvedValue({
        id: 1,
        role: [Role.ADMINISTRATOR],
      });
      mockFindByRoles.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockDeleteUser.mockResolvedValue(true);

      const res = await deleteMunicipalityUser(1);
      expect(res).toBe(true);
    });

    it("should delete normal municipality user without count check", async () => {
      mockFindById.mockResolvedValue({
        id: 1,
        role: [Role.PUBLIC_RELATIONS],
      });
      mockDeleteUser.mockResolvedValue(true);

      await deleteMunicipalityUser(1);
      expect(mockFindByRoles).not.toHaveBeenCalled();
      expect(mockDeleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe("findMunicipalityUserByEmail", () => {
    it("should return null if not found", async () => {
      mockFindByEmail.mockResolvedValue(null);
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toBeNull();
    });

    it("should return null if role invalid", async () => {
      mockFindByEmail.mockResolvedValue({
        role: [Role.CITIZEN],
      });
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toBeNull();
    });

    it("should return user if valid", async () => {
      const u = { role: [Role.PUBLIC_RELATIONS] };
      mockFindByEmail.mockResolvedValue(u);
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toEqual(u);
    });
  });
});
