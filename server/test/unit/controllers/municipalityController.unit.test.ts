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
    return jest.requireActual("../../../src/interfaces/UserDTO").MUNICIPALITY_ROLES;
  }
}));

const mockCreate = municipalityService.createMunicipalityUser as jest.MockedFunction<typeof municipalityService.createMunicipalityUser>;
const mockGetAll = municipalityService.getAllMunicipalityUsers as jest.MockedFunction<typeof municipalityService.getAllMunicipalityUsers>;
const mockGetById = municipalityService.getMunicipalityUserById as jest.MockedFunction<typeof municipalityService.getMunicipalityUserById>;
const mockDelete = municipalityService.deleteMunicipalityUser as jest.MockedFunction<typeof municipalityService.deleteMunicipalityUser>;
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
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe("createMunicipalityUserController", () => {
    it("should create user successfully", async () => {
      mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'P', role: Roles.PUBLIC_RELATIONS };
      mockFindByEmail.mockResolvedValue(null as any);
      mockHash.mockResolvedValue({ hashedPassword: 'h', salt: 's' });
      const created = { id: 1, email: 'a@b.com', role: Roles.PUBLIC_RELATIONS } as any;
      mockCreate.mockResolvedValue(created);

      await createMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockFindByEmail).toHaveBeenCalledWith('a@b.com');
      expect(mockHash).toHaveBeenCalledWith('P');
      expect(mockCreate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 on missing fields", async () => {
      mockReq.body = { firstName: 'A' };
      await createMunicipalityUserController(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 on invalid role", async () => {
      mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: 'INVALID' };
      await createMunicipalityUserController(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 409 when email exists", async () => {
      mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: Roles.PUBLIC_RELATIONS };
      mockFindByEmail.mockResolvedValue({ id: 1 } as any);
      await createMunicipalityUserController(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it("should handle service errors", async () => {
      mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'P', role: Roles.PUBLIC_RELATIONS };
      mockFindByEmail.mockResolvedValue(null as any);
      mockHash.mockRejectedValue(new Error('Hash failed'));

      await createMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Unable to create municipality user"
      });
    });
  });

  describe("listMunicipalityUsersController", () => {
    it("should return list of users successfully", async () => {
      const mockUsers = [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: Roles.ADMINISTRATOR },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: Roles.TECHNICAL_OFFICE }
      ];
      mockGetAll.mockResolvedValue(mockUsers as any);

      await listMunicipalityUsersController(mockReq as Request, mockRes as Response);

      expect(mockGetAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockGetAll.mockRejectedValue(new Error('Database error'));

      await listMunicipalityUsersController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Failed to retrieve users"
      });
    });
  });

  describe("getMunicipalityUserController", () => {
    it("should return user successfully", async () => {
      mockReq.params = { userId: '1' };
      const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: Roles.ADMINISTRATOR };
      mockGetById.mockResolvedValue(mockUser as any);

      await getMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockGetById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid userId", async () => {
      mockReq.params = { userId: 'invalid' };

      await getMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Invalid user ID format"
      });
    });

    it("should return 404 when user not found", async () => {
      mockReq.params = { userId: '999' };
      mockGetById.mockResolvedValue(null);

      await getMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockGetById).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "NotFound",
        message: "Municipality user not found"
      });
    });

    it("should handle service errors", async () => {
      mockReq.params = { userId: '1' };
      mockGetById.mockRejectedValue(new Error('Database error'));

      await getMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Failed to retrieve user"
      });
    });
  });

  describe("deleteMunicipalityUserController", () => {
    it("should delete user successfully", async () => {
      mockReq.params = { userId: '1' };
      mockDelete.mockResolvedValue(true);

      await deleteMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 400 for invalid userId", async () => {
      mockReq.params = { userId: 'invalid' };

      await deleteMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Invalid user ID format"
      });
    });

    it("should return 404 when user not found", async () => {
      mockReq.params = { userId: '999' };
      mockDelete.mockResolvedValue(false);

      await deleteMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockDelete).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "NotFound",
        message: "Municipality user not found"
      });
    });

    it("should handle service errors", async () => {
      mockReq.params = { userId: '1' };
      mockDelete.mockRejectedValue(new Error('Database error'));

      await deleteMunicipalityUserController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Failed to delete user"
      });
    });
  });

  describe("listRolesController", () => {
    it("should return list of roles successfully", async () => {
      await listRolesController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should handle errors during roles listing", async () => {
      // Mock res.status to throw an error
      const errorMockRes = {
        status: jest.fn().mockImplementation(() => {
          throw new Error("Simulated error in response");
        }),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Call the controller and catch any thrown errors
      try {
        await listRolesController(mockReq as Request, errorMockRes);
      } catch (error) {
        // Expected to throw due to our mock
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error listing roles:", expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
