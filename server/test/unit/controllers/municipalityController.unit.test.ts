import { Request, Response } from "express";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  deleteMunicipalityUserController,
  listRolesController,
} from "../../../src/controllers/municipalityController";
import * as municipalityService from "../../../src/services/municipalityUserService";
import { findByEmail } from "../../../src/services/userService";
import { hashPassword } from "../../../src/services/passwordService";
import { Roles } from "../../../src/interfaces/UserDTO";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../src/utils";

jest.mock("../../../src/services/municipalityUserService");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");

// Mock the UserDTO module to allow us to mock MUNICIPALITY_ROLES
jest.mock("../../../src/interfaces/UserDTO", () => ({
  ...jest.requireActual("../../../src/interfaces/UserDTO"),
  get MUNICIPALITY_ROLES() {
    if ((global as any).shouldThrowOnRolesAccess) {
      throw new Error("Error accessing MUNICIPALITY_ROLES");
    }
    return jest.requireActual("../../../src/interfaces/UserDTO")
      .MUNICIPALITY_ROLES;
  },
}));

const mockCreate =
  municipalityService.createMunicipalityUser as jest.MockedFunction<
    typeof municipalityService.createMunicipalityUser
  >;
const mockGetAll =
  municipalityService.getAllMunicipalityUsers as jest.MockedFunction<
    typeof municipalityService.getAllMunicipalityUsers
  >;
const mockGetById =
  municipalityService.getMunicipalityUserById as jest.MockedFunction<
    typeof municipalityService.getMunicipalityUserById
  >;
const mockDelete =
  municipalityService.deleteMunicipalityUser as jest.MockedFunction<
    typeof municipalityService.deleteMunicipalityUser
  >;
const mockFindByEmail = findByEmail as jest.MockedFunction<typeof findByEmail>;
const mockHash = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe("municipalityController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("createMunicipalityUserController", () => {
    it("should create user successfully", async () => {
      mockReq.body = {
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        password: "P",
        role: Roles.PUBLIC_RELATIONS,
      };
      mockFindByEmail.mockResolvedValue(null as any);
      mockHash.mockResolvedValue({ hashedPassword: "h", salt: "s" });
      const created = {
        id: 1,
        email: "a@b.com",
        role: Roles.PUBLIC_RELATIONS,
      } as any;
      mockCreate.mockResolvedValue(created);

      await createMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockFindByEmail).toHaveBeenCalledWith("a@b.com");
      expect(mockHash).toHaveBeenCalledWith("P");
      expect(mockCreate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 on missing fields", async () => {
      mockReq.body = { firstName: "A" };
      await expect(
        createMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should return 400 on invalid role", async () => {
      mockReq.body = {
        firstName: "A",
        lastName: "B",
        email: "a@b",
        password: "P",
        role: "INVALID",
      };
      await expect(
        createMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should return 409 when email exists", async () => {
      mockReq.body = {
        firstName: "A",
        lastName: "B",
        email: "a@b",
        password: "P",
        role: Roles.PUBLIC_RELATIONS,
      };
      mockFindByEmail.mockResolvedValue({ id: 1 } as any);
      await expect(
        createMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow(ConflictError);
    });

    it("should handle service errors", async () => {
      mockReq.body = {
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        password: "P",
        role: Roles.PUBLIC_RELATIONS,
      };
      mockFindByEmail.mockResolvedValue(null as any);
      mockHash.mockRejectedValue(new Error("Hash failed"));

      await expect(
        createMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow();
    });
  });

  describe("listMunicipalityUsersController", () => {
    it("should return list of users successfully", async () => {
      const mockUsers = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          role: Roles.ADMINISTRATOR,
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          role: Roles.MUNICIPAL_BUILDING_MAINTENANCE,
        },
      ];
      mockGetAll.mockResolvedValue(mockUsers as any);

      await listMunicipalityUsersController(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockGetAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockGetAll.mockRejectedValue(new Error("Database error"));
      await expect(
        listMunicipalityUsersController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });
  });

  describe("getMunicipalityUserController", () => {
    it("should return user successfully", async () => {
      mockReq.params = { userId: "1" };
      const mockUser = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        role: Roles.ADMINISTRATOR,
      };
      mockGetById.mockResolvedValue(mockUser as any);

      await getMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockGetById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid userId", async () => {
      mockReq.params = { userId: "invalid" };
      await expect(
        getMunicipalityUserController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return 404 when user not found", async () => {
      mockReq.params = { userId: "999" };
      mockGetById.mockResolvedValue(null);
      await expect(
        getMunicipalityUserController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle service errors", async () => {
      mockReq.params = { userId: "1" };
      mockGetById.mockRejectedValue(new Error("Database error"));
      await expect(
        getMunicipalityUserController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });
  });

  describe("deleteMunicipalityUserController", () => {
    it("should delete municipality user successfully", async () => {
      mockReq.params = { userId: "1" };
      mockDelete.mockResolvedValue(true);

      await deleteMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 400 for invalid user ID", async () => {
      mockReq.params = { userId: "invalid" };

      await expect(
        deleteMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should return 404 when user not found", async () => {
      mockReq.params = { userId: "999" };
      mockDelete.mockResolvedValue(false);

      await expect(
        deleteMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle service errors", async () => {
      mockReq.params = { userId: "1" };
      mockDelete.mockRejectedValue(new Error("Database error"));

      await expect(
        deleteMunicipalityUserController(
          mockReq as Request,
          mockRes as Response
        )
      ).rejects.toThrow();
    });
  });

  describe("listRolesController", () => {
    it("should return list of roles successfully", async () => {
      await listRolesController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
