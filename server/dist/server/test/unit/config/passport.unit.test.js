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
const UserDTO_1 = require("../../../src/interfaces/UserDTO");
const UserDTO_2 = require("../../../src/interfaces/UserDTO");
const userService = __importStar(require("../../../src/services/userService"));
const passwordService = __importStar(require("../../../src/services/passwordService"));
// Mock dependencies
jest.mock('../../../src/services/userService');
jest.mock('../../../src/services/passwordService');
jest.mock('../../../src/interfaces/UserDTO');
const mockFindByEmail = userService.findByEmail;
const mockFindById = userService.findById;
const mockVerifyPassword = passwordService.verifyPassword;
const mockToUserDTO = UserDTO_2.toUserDTO;
// Mock passport 
const mockUse = jest.fn();
const mockSerializeUser = jest.fn();
const mockDeserializeUser = jest.fn();
jest.mock('passport', () => ({
    use: mockUse,
    serializeUser: mockSerializeUser,
    deserializeUser: mockDeserializeUser,
}));
// Import configurePassport after mocking
const passport_1 = require("../../../src/config/passport");
describe('passport configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('configurePassport', () => {
        it('should configure passport with local strategy', () => {
            (0, passport_1.configurePassport)();
            // Verify that passport.use was called (strategy was registered)
            expect(mockUse).toHaveBeenCalledTimes(1);
            // Verify that serialization functions were set up
            expect(mockSerializeUser).toHaveBeenCalledTimes(1);
            expect(mockDeserializeUser).toHaveBeenCalledTimes(1);
        });
        describe('LocalStrategy authentication', () => {
            let strategyCallback;
            beforeEach(() => {
                (0, passport_1.configurePassport)();
                // Extract the strategy callback from the LocalStrategy constructor call
                const strategyInstance = mockUse.mock.calls[0][0];
                strategyCallback = strategyInstance._verify;
            });
            it('should authenticate user with valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUser = {
                    id: 1,
                    email: 'test@example.com',
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'CITIZEN'
                };
                const mockUserDTO = {
                    id: 1,
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    role: UserDTO_1.Roles.CITIZEN,
                    telegramUsername: null,
                    emailNotificationsEnabled: true
                };
                mockFindByEmail.mockResolvedValue(mockUser);
                mockVerifyPassword.mockResolvedValue(true);
                mockToUserDTO.mockReturnValue(mockUserDTO);
                const doneSpy = jest.fn();
                yield strategyCallback('test@example.com', 'password123', doneSpy);
                expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
                expect(mockVerifyPassword).toHaveBeenCalledWith(mockUser, 'password123');
                expect(mockToUserDTO).toHaveBeenCalledWith(mockUser);
                expect(doneSpy).toHaveBeenCalledWith(null, mockUserDTO);
            }));
            it('should reject user with non-existent email', () => __awaiter(void 0, void 0, void 0, function* () {
                mockFindByEmail.mockResolvedValue(null);
                const doneSpy = jest.fn();
                yield strategyCallback('nonexistent@example.com', 'password123', doneSpy);
                expect(mockFindByEmail).toHaveBeenCalledWith('nonexistent@example.com');
                expect(mockVerifyPassword).not.toHaveBeenCalled();
                expect(mockToUserDTO).not.toHaveBeenCalled();
                expect(doneSpy).toHaveBeenCalledWith(null, false);
            }));
            it('should reject user with invalid password', () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUser = {
                    id: 1,
                    email: 'test@example.com',
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'CITIZEN'
                };
                mockFindByEmail.mockResolvedValue(mockUser);
                mockVerifyPassword.mockResolvedValue(false);
                const doneSpy = jest.fn();
                yield strategyCallback('test@example.com', 'wrongpassword', doneSpy);
                expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
                expect(mockVerifyPassword).toHaveBeenCalledWith(mockUser, 'wrongpassword');
                expect(mockToUserDTO).not.toHaveBeenCalled();
                expect(doneSpy).toHaveBeenCalledWith(null, false);
            }));
            it('should handle database errors during authentication', () => __awaiter(void 0, void 0, void 0, function* () {
                const dbError = new Error('Database connection failed');
                mockFindByEmail.mockRejectedValue(dbError);
                const doneSpy = jest.fn();
                yield strategyCallback('test@example.com', 'password123', doneSpy);
                expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
                expect(doneSpy).toHaveBeenCalledWith(dbError);
            }));
        });
        it('should set up user serialization', () => {
            (0, passport_1.configurePassport)();
            const serializeCall = mockSerializeUser.mock.calls[0][0];
            expect(typeof serializeCall).toBe('function');
            // Test serialization function
            const mockUser = { id: 123 };
            const doneSpy = jest.fn();
            serializeCall(mockUser, doneSpy);
            expect(doneSpy).toHaveBeenCalledWith(null, 123);
        });
        it('should set up user deserialization for valid user', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                id: 123,
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                role: 'CITIZEN'
            };
            const mockUserDTO = {
                id: 123,
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                role: UserDTO_1.Roles.CITIZEN,
                telegramUsername: null,
                emailNotificationsEnabled: true
            };
            mockFindById.mockResolvedValue(mockUser);
            mockToUserDTO.mockReturnValue(mockUserDTO);
            (0, passport_1.configurePassport)();
            const deserializeCall = mockDeserializeUser.mock.calls[0][0];
            expect(typeof deserializeCall).toBe('function');
            const doneSpy = jest.fn();
            yield deserializeCall(123, doneSpy);
            expect(mockFindById).toHaveBeenCalledWith(123);
            expect(mockToUserDTO).toHaveBeenCalledWith(mockUser);
            expect(doneSpy).toHaveBeenCalledWith(null, mockUserDTO);
        }));
        it('should handle non-existent user during deserialization', () => __awaiter(void 0, void 0, void 0, function* () {
            mockFindById.mockResolvedValue(null);
            (0, passport_1.configurePassport)();
            const deserializeCall = mockDeserializeUser.mock.calls[0][0];
            const doneSpy = jest.fn();
            yield deserializeCall(456, doneSpy);
            expect(mockFindById).toHaveBeenCalledWith(456);
            expect(doneSpy).toHaveBeenCalledWith(null, false);
        }));
        it('should handle database errors during deserialization', () => __awaiter(void 0, void 0, void 0, function* () {
            const dbError = new Error('Database error');
            mockFindById.mockRejectedValue(dbError);
            (0, passport_1.configurePassport)();
            const deserializeCall = mockDeserializeUser.mock.calls[0][0];
            const doneSpy = jest.fn();
            yield deserializeCall(789, doneSpy);
            expect(mockFindById).toHaveBeenCalledWith(789);
            expect(doneSpy).toHaveBeenCalledWith(dbError);
        }));
    });
});
