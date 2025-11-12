import { Request, Response } from "express";
import {
  createMunicipalityUserController,
  updateMunicipalityUserController,
  patchMunicipalityUserRoleController,
} from "../../../src/controllers/municipalityController";
import * as municipalityService from "../../../src/services/municipalityUserService";
import { findByEmail } from "../../../src/services/userService";
import { hashPassword } from "../../../src/services/passwordService";
import { Roles } from "../../../src/interfaces/UserDTO";

jest.mock("../../../src/services/municipalityUserService");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");

const mockCreate =
  municipalityService.createMunicipalityUser as jest.MockedFunction<
    typeof municipalityService.createMunicipalityUser
  >;
const mockFindByEmail = findByEmail as jest.MockedFunction<typeof findByEmail>;
const mockHash = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe("municipalityController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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
      await createMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 on invalid role", async () => {
      mockReq.body = {
        firstName: "A",
        lastName: "B",
        email: "a@b",
        password: "P",
        role: "INVALID",
      };
      await createMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
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
      await createMunicipalityUserController(
        mockReq as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe("updateMunicipalityUserController - role validation and payload", () => {
    it("should return 400 when invalid userId", async () => {
      const req = { params: { userId: "abc" }, body: {} } as any;
      await updateMunicipalityUserController(
        req as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when no fields provided", async () => {
      const req = { params: { userId: "1" }, body: {} } as any;
      await updateMunicipalityUserController(
        req as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("patchMunicipalityUserRoleController", () => {
    it("should update role successfully", async () => {
      const req = {
        params: { userId: "1" },
        body: { role: Roles.ADMINISTRATOR },
      } as any;
      const updatedUser = {
        id: 1,
        email: "a@b.com",
        role: Roles.ADMINISTRATOR,
      } as any;
      const mockUpdate =
        municipalityService.updateMunicipalityUser as jest.MockedFunction<
          typeof municipalityService.updateMunicipalityUser
        >;
      mockUpdate.mockResolvedValue(updatedUser);

      await patchMunicipalityUserRoleController(
        req as Request,
        mockRes as Response
      );

      expect(mockUpdate).toHaveBeenCalledWith(1, { role: Roles.ADMINISTRATOR });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        firstName: undefined, // assuming toMunicipalityUserDTO maps accordingly
        lastName: undefined,
        email: "a@b.com",
        role: Roles.ADMINISTRATOR,
      });
    });

    it("should return 400 on invalid userId", async () => {
      const req = {
        params: { userId: "abc" },
        body: { role: Roles.ADMINISTRATOR },
      } as any;
      await patchMunicipalityUserRoleController(
        req as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Invalid user ID format",
      });
    });

    it("should return 400 on invalid role", async () => {
      const req = { params: { userId: "1" }, body: { role: "INVALID" } } as any;
      await patchMunicipalityUserRoleController(
        req as Request,
        mockRes as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Invalid role value",
      });
    });

    it("should return 404 when user not found", async () => {
      const req = {
        params: { userId: "1" },
        body: { role: Roles.ADMINISTRATOR },
      } as any;
      const mockUpdate =
        municipalityService.updateMunicipalityUser as jest.MockedFunction<
          typeof municipalityService.updateMunicipalityUser
        >;
      mockUpdate.mockResolvedValue(null);

      await patchMunicipalityUserRoleController(
        req as Request,
        mockRes as Response
      );

      expect(mockUpdate).toHaveBeenCalledWith(1, { role: Roles.ADMINISTRATOR });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "NotFound",
        message: "Municipality user not found",
      });
    });

    it("should return 500 on error", async () => {
      const req = {
        params: { userId: "1" },
        body: { role: Roles.ADMINISTRATOR },
      } as any;
      const mockUpdate =
        municipalityService.updateMunicipalityUser as jest.MockedFunction<
          typeof municipalityService.updateMunicipalityUser
        >;
      mockUpdate.mockRejectedValue(new Error("DB error"));

      await patchMunicipalityUserRoleController(
        req as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Failed to assign role",
      });
    });
  });
});
