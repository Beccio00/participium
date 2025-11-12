"use strict";
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
exports.createTestUserData = createTestUserData;
exports.createUserInDatabase = createUserInDatabase;
exports.verifyPasswordIsHashed = verifyPasswordIsHashed;
exports.delay = delay;
const passwordService_1 = require("../../src/services/passwordService");
const testSetup_1 = require("./testSetup");
/**
 * Create test user data
 */
function createTestUserData(overrides) {
    return Object.assign({ firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com', password: 'Test1234!' }, overrides);
}
/**
 * Create user directly in database (for test setup)
 */
function createUserInDatabase(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultData = {
            email: 'existing@test.com',
            first_name: 'Existing',
            last_name: 'User',
            password: 'Test1234!',
            role: 'CITIZEN',
        };
        const data = Object.assign(Object.assign({}, defaultData), userData);
        const { hashedPassword, salt } = yield (0, passwordService_1.hashPassword)(data.password);
        return yield testSetup_1.prisma.user.create({
            data: {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                password: hashedPassword,
                salt: salt,
                role: data.role,
            },
        });
    });
}
/**
 * Verify password is correctly hashed before storage
 */
function verifyPasswordIsHashed(email, plainPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield testSetup_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return false;
        // Password should be a hash, not equal to plain password
        return user.password !== plainPassword && user.password.length > 50;
    });
}
/**
 * Wait for specified time (for async operations)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
