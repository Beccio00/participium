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
const municipalityUserService_1 = require("../../../src/services/municipalityUserService");
const userService = __importStar(require("../../../src/services/userService"));
const UserDTO_1 = require("../../../src/interfaces/UserDTO");
jest.mock("../../../src/services/userService");
const mockCreateUser = userService.createUser;
const mockFindByEmail = userService.findByEmail;
const mockFindById = userService.findById;
const mockUpdateUser = userService.updateUser;
const mockDeleteUser = userService.deleteUser;
const mockFindUsersByRoles = userService.findUsersByRoles;
describe("municipalityUserService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("createMunicipalityUser should call createUser and return created user", () => __awaiter(void 0, void 0, void 0, function* () {
        const payload = { email: "a@b.com", first_name: "A", last_name: "B", password: "p", salt: "s", role: UserDTO_1.Roles.ADMINISTRATOR };
        const created = Object.assign({ id: 1 }, payload);
        mockCreateUser.mockResolvedValue(created);
        const res = yield (0, municipalityUserService_1.createMunicipalityUser)(payload);
        expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ email: payload.email, role: payload.role }));
        expect(res).toEqual(created);
    }));
    it("getAllMunicipalityUsers should call findUsersByRoles", () => __awaiter(void 0, void 0, void 0, function* () {
        const users = [{ id: 1, role: UserDTO_1.Roles.PUBLIC_RELATIONS }];
        mockFindUsersByRoles.mockResolvedValue(users);
        const res = yield (0, municipalityUserService_1.getAllMunicipalityUsers)();
        expect(mockFindUsersByRoles).toHaveBeenCalled();
        // ensure ADMINISTRATOR is excluded from the roles passed to findUsersByRoles
        const calledArg = mockFindUsersByRoles.mock.calls[0][0];
        expect(calledArg).not.toContain(UserDTO_1.Roles.ADMINISTRATOR);
        expect(res).toEqual(users);
    }));
    it("getMunicipalityUserById should return user when role is municipality role", () => __awaiter(void 0, void 0, void 0, function* () {
        const u = { id: 2, role: UserDTO_1.Roles.TECHNICAL_OFFICE };
        mockFindById.mockResolvedValue(u);
        const res = yield (0, municipalityUserService_1.getMunicipalityUserById)(2);
        expect(mockFindById).toHaveBeenCalledWith(2);
        expect(res).toEqual(u);
    }));
    it("getMunicipalityUserById should return null for non-municipality role", () => __awaiter(void 0, void 0, void 0, function* () {
        const u = { id: 3, role: 'CITIZEN' };
        mockFindById.mockResolvedValue(u);
        const res = yield (0, municipalityUserService_1.getMunicipalityUserById)(3);
        expect(res).toBeNull();
    }));
    it("updateMunicipalityUser should return updated user when exists", () => __awaiter(void 0, void 0, void 0, function* () {
        const existing = { id: 4, role: UserDTO_1.Roles.PUBLIC_RELATIONS };
        mockFindById.mockResolvedValue(existing);
        const updated = { id: 4, first_name: 'X' };
        mockUpdateUser.mockResolvedValue(updated);
        const res = yield (0, municipalityUserService_1.updateMunicipalityUser)(4, { first_name: 'X' });
        expect(mockUpdateUser).toHaveBeenCalledWith(4, expect.any(Object));
        expect(res).toEqual(updated);
    }));
    it("deleteMunicipalityUser should delete when exists and return true", () => __awaiter(void 0, void 0, void 0, function* () {
        const existing = { id: 5, role: UserDTO_1.Roles.PUBLIC_RELATIONS };
        mockFindById.mockResolvedValue(existing);
        mockDeleteUser.mockResolvedValue(true);
        const res = yield (0, municipalityUserService_1.deleteMunicipalityUser)(5);
        expect(mockDeleteUser).toHaveBeenCalledWith(5);
        expect(res).toBeTruthy();
    }));
    it("findMunicipalityUserByEmail should return null when role not municipality", () => __awaiter(void 0, void 0, void 0, function* () {
        const u = { id: 6, role: 'CITIZEN' };
        mockFindByEmail.mockResolvedValue(u);
        const res = yield (0, municipalityUserService_1.findMunicipalityUserByEmail)('x@x');
        expect(res).toBeNull();
    }));
});
