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

const mockCreate = municipalityService.createMunicipalityUser as jest.MockedFunction<typeof municipalityService.createMunicipalityUser>;
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
  });
});
