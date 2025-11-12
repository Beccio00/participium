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
jest.mock("../../../src/services/municipalityUserService");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
const mockCreate = municipalityService.createMunicipalityUser;
const mockFindByEmail = userService_1.findByEmail;
const mockHash = passwordService_1.hashPassword;
describe("municipalityController", () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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
            yield (0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        }));
        it("should return 400 on invalid role", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: 'INVALID' };
            yield (0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        }));
        it("should return 409 when email exists", () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = { firstName: 'A', lastName: 'B', email: 'a@b', password: 'P', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            mockFindByEmail.mockResolvedValue({ id: 1 });
            yield (0, municipalityController_1.createMunicipalityUserController)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(409);
        }));
    });
    describe("updateMunicipalityUserController - role validation and payload", () => {
        it("should return 400 when invalid userId", () => __awaiter(void 0, void 0, void 0, function* () {
            const req = { params: { userId: 'abc' }, body: {} };
            yield (0, municipalityController_1.updateMunicipalityUserController)(req, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        }));
        it("should return 400 when no fields provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const req = { params: { userId: '1' }, body: {} };
            yield (0, municipalityController_1.updateMunicipalityUserController)(req, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        }));
    });
});
