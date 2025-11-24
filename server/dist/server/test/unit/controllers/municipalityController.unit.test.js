"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const municipalityController_1 = require("../../../src/controllers/municipalityController");
const municipalityService = __importStar(require("../../../src/services/municipalityUserService"));
const userService_1 = require("../../../src/services/userService");
const passwordService_1 = require("../../../src/services/passwordService");
const UserDTO_1 = require("../../../src/interfaces/UserDTO");
const utils_1 = require("../../../src/utils");
jest.mock("../../../src/services/municipalityUserService");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
// Mock the UserDTO module to allow us to mock MUNICIPALITY_ROLES
jest.mock("../../../src/interfaces/UserDTO", () => (Object.assign(Object.assign({}, jest.requireActual("../../../src/interfaces/UserDTO")), { get MUNICIPALITY_ROLES() {
        if (global.shouldThrowOnRolesAccess) {
            throw new Error("Error accessing MUNICIPALITY_ROLES");
        }
        return jest.requireActual("../../../src/interfaces/UserDTO").MUNICIPALITY_ROLES;
    } })));
const mockCreate = municipalityService.createMunicipalityUser;
const mockGetAll = municipalityService.getAllMunicipalityUsers;
const mockGetById = municipalityService.getMunicipalityUserById;
const mockDelete = municipalityService.deleteMunicipalityUser;
const mockFindByEmail = userService_1.findByEmail;
const mockHash = passwordService_1.hashPassword;
describe("municipalityController", () => {
    let mockReq;
    let mockRes;
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
        it("should create user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'P', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            mockFindByEmail.mockResolvedValue(null);
            mockHash.mockResolvedValue({ hashedPassword: 'h', salt: 's' });
            const created = { id: 1, email: 'a@b.com', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            mockCreate.mockResolvedValue(created);
            yield (0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes);
            expect(mockFindByEmail).toHaveBeenCalledWith('a@b.com');
            expect(mockHash).toHaveBeenCalledWith('P');
            expect(mockCreate).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        }));
        it("should return 400 on missing fields", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A' };
            yield expect((0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow(utils_1.BadRequestError);
        }));
        it("should return 400 on invalid role", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: 'INVALID' };
            yield expect((0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow(utils_1.BadRequestError);
        }));
        it("should return 409 when email exists", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            mockFindByEmail.mockResolvedValue({ id: 1 });
            yield expect((0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow(utils_1.ConflictError);
        }));
        it("should handle service errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'P', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            mockFindByEmail.mockResolvedValue(null);
            mockHash.mockRejectedValue(new Error('Hash failed'));
            yield expect((0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow();
        }));
    });
    describe("listMunicipalityUsersController", () => {
        it("should return list of users successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUsers = [
                { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: UserDTO_1.Roles.ADMINISTRATOR },
                { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: UserDTO_1.Roles.MUNICIPAL_BUILDING_MAINTENANCE }
            ];
            mockGetAll.mockResolvedValue(mockUsers);
            yield (0, municipalityController_1.listMunicipalityUsersController)(mockReq, mockRes);
            expect(mockGetAll).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
        }));
        it("should handle service errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockGetAll.mockRejectedValue(new Error('Database error'));
            yield expect((0, municipalityController_1.listMunicipalityUsersController)(mockReq, mockRes))
                .rejects.toThrow();
        }));
    });
    describe("getMunicipalityUserController", () => {
        it("should return user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '1' };
            const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: UserDTO_1.Roles.ADMINISTRATOR };
            mockGetById.mockResolvedValue(mockUser);
            yield (0, municipalityController_1.getMunicipalityUserController)(mockReq, mockRes);
            expect(mockGetById).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
        }));
        it("should return 400 for invalid userId", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: 'invalid' };
            yield expect((0, municipalityController_1.getMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow(utils_1.BadRequestError);
        }));
        it("should return 404 when user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '999' };
            mockGetById.mockResolvedValue(null);
            yield expect((0, municipalityController_1.getMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow(utils_1.NotFoundError);
        }));
        it("should handle service errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '1' };
            mockGetById.mockRejectedValue(new Error('Database error'));
            yield expect((0, municipalityController_1.getMunicipalityUserController)(mockReq, mockRes))
                .rejects.toThrow();
        }));
    });
    describe("deleteMunicipalityUserController", () => {
        it("should delete municipality user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '1' };
            mockDelete.mockResolvedValue(true);
            yield (0, municipalityController_1.deleteMunicipalityUserController)(mockReq, mockRes);
            expect(mockDelete).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        }));
        it("should return 400 for invalid user ID", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: 'invalid' };
            yield expect((0, municipalityController_1.deleteMunicipalityUserController)(mockReq, mockRes)).rejects.toThrow(utils_1.BadRequestError);
        }));
        it("should return 404 when user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '999' };
            mockDelete.mockResolvedValue(false);
            yield expect((0, municipalityController_1.deleteMunicipalityUserController)(mockReq, mockRes)).rejects.toThrow(utils_1.NotFoundError);
        }));
        it("should handle service errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.params = { userId: '1' };
            mockDelete.mockRejectedValue(new Error('Database error'));
            yield expect((0, municipalityController_1.deleteMunicipalityUserController)(mockReq, mockRes)).rejects.toThrow();
        }));
    });
    describe("listRolesController", () => {
        it("should return list of roles successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, municipalityController_1.listRolesController)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
        }));
    });
});
