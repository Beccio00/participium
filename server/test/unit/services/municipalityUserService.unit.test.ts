import {
  createMunicipalityUser,
  getAllMunicipalityUsers,
  getMunicipalityUserById,
  updateMunicipalityUser,
  deleteMunicipalityUser,
  findMunicipalityUserByEmail,
} from "../../../src/services/municipalityUserService";
import { Roles } from "../../../src/interfaces/UserDTO";
import { BadRequestError } from "../../../src/utils";
import * as userService from "../../../src/services/userService";
import { PrismaClient } from "@prisma/client";

// Mock userService
jest.mock("../../../src/services/userService");
const mockUserService = userService as jest.Mocked<typeof userService>;

// CORRECTION: Mock UserDTO to ensure ADMINISTRATOR is considered a municipality role
// This ensures getMunicipalityUserById returns the user instead of null during tests
jest.mock("../../../src/interfaces/UserDTO", () => {
  const original = jest.requireActual("../../../src/interfaces/UserDTO");
  return {
    ...original,
    MUNICIPALITY_ROLES: [
      "ADMINISTRATOR",
      "PUBLIC_RELATIONS",
      "MUNICIPAL_BUILDING_MAINTENANCE",
      // Include other roles if needed
    ],
  };
});

// Mock @prisma/client locally for countAdministrators
jest.mock("@prisma/client", () => {
  const mCount = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        count: mCount,
      },
    })),
  };
});

describe("municipalityUserService", () => {
  const prismaMock = new PrismaClient();
  const mockCount = prismaMock.user.count as jest.Mock;

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
        role: Roles.PUBLIC_RELATIONS,
      };
      mockUserService.createUser.mockResolvedValue({ id: 1 } as any);
      await createMunicipalityUser(data);
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "e",
          role: Roles.PUBLIC_RELATIONS,
          email_notifications_enabled: true,
        })
      );
    });
  });

  describe("getAllMunicipalityUsers", () => {
    it("should delegate to findUsersByRoles", async () => {
      await getAllMunicipalityUsers();
      expect(mockUserService.findUsersByRoles).toHaveBeenCalled();
    });
  });

  describe("getMunicipalityUserById", () => {
    it("should return null if user not found", async () => {
      mockUserService.findById.mockResolvedValue(null);
      const res = await getMunicipalityUserById(1);
      expect(res).toBeNull();
    });

    it("should return null if user role is not municipality", async () => {
      mockUserService.findById.mockResolvedValue({
        id: 1,
        role: Roles.CITIZEN,
      } as any);
      const res = await getMunicipalityUserById(1);
      expect(res).toBeNull();
    });

    it("should return user if valid role", async () => {
      const user = { id: 1, role: Roles.MUNICIPAL_BUILDING_MAINTENANCE } as any;
      mockUserService.findById.mockResolvedValue(user);
      const res = await getMunicipalityUserById(1);
      expect(res).toEqual(user);
    });
  });

  describe("updateMunicipalityUser", () => {
    it("should return null if user validation fails", async () => {
      mockUserService.findById.mockResolvedValue(null);
      const res = await updateMunicipalityUser(1, {});
      expect(res).toBeNull();
    });

    it("should call updateUser with mapped fields", async () => {
      const user = { id: 1, role: Roles.PUBLIC_RELATIONS } as any;
      mockUserService.findById.mockResolvedValue(user);
      mockUserService.updateUser.mockResolvedValue({
        ...user,
        first_name: "New",
      });

      const res = await updateMunicipalityUser(1, { first_name: "New" });
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, {
        first_name: "New",
      });
      expect(res).toEqual({ ...user, first_name: "New" });
    });
  });

  describe("deleteMunicipalityUser", () => {
    it("should return false if user doesn't exist", async () => {
      mockUserService.findById.mockResolvedValue(null);
      const res = await deleteMunicipalityUser(1);
      expect(res).toBe(false);
    });

    it("should throw BadRequestError if trying to delete the last administrator", async () => {
      mockUserService.findById.mockResolvedValue({
        id: 1,
        role: Roles.ADMINISTRATOR,
      } as any);
      mockCount.mockResolvedValue(1); 

      await expect(deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
    });

    it("should allow deleting administrator if others exist", async () => {
      mockUserService.findById.mockResolvedValue({
        id: 1,
        role: Roles.ADMINISTRATOR,
      } as any);
      mockCount.mockResolvedValue(2); 
      mockUserService.deleteUser.mockResolvedValue(true);

      const res = await deleteMunicipalityUser(1);
      expect(res).toBe(true);
    });

    it("should delete normal municipality user without count check", async () => {
      mockUserService.findById.mockResolvedValue({
        id: 1,
        role: Roles.PUBLIC_RELATIONS,
      } as any);
      mockUserService.deleteUser.mockResolvedValue(true);

      await deleteMunicipalityUser(1);
      expect(mockCount).not.toHaveBeenCalled();
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe("findMunicipalityUserByEmail", () => {
    it("should return null if not found", async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toBeNull();
    });

    it("should return null if role invalid", async () => {
      mockUserService.findByEmail.mockResolvedValue({
        role: Roles.CITIZEN,
      } as any);
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toBeNull();
    });

    it("should return user if valid", async () => {
      const u = { role: Roles.PUBLIC_RELATIONS } as any;
      mockUserService.findByEmail.mockResolvedValue(u);
      const res = await findMunicipalityUserByEmail("a");
      expect(res).toEqual(u);
    });
  });
});