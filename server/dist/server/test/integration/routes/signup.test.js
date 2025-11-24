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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../../src/app");
const testSetup_1 = require("../../helpers/testSetup");
const testUtils_1 = require("../../helpers/testUtils");
const app = (0, app_1.createApp)();
describe('POST /api/citizen/signup', () => {
    // Clean database before each test
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
    }));
    // Disconnect database after all tests
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    describe('Success scenarios', () => {
        it('should successfully register a new citizen with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = (0, testUtils_1.createTestUserData)({
                email: `test-${Date.now()}@example.com` // Use unique email to avoid conflicts
            });
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData);
            // Assert - Check status code
            if (response.status !== 201) {
                console.error('Registration failed:', response.body);
            }
            expect(response.status).toBe(201);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body).toHaveProperty('firstName', userData.firstName);
            expect(response.body).toHaveProperty('lastName', userData.lastName);
            expect(response.body).toHaveProperty('email', userData.email);
            expect(response.body).toHaveProperty('role', 'CITIZEN');
            expect(response.body).toHaveProperty('telegramUsername', null);
            expect(response.body).toHaveProperty('emailNotificationsEnabled', true);
            // Ensure password and salt are not returned
            expect(response.body).not.toHaveProperty('password');
            expect(response.body).not.toHaveProperty('salt');
        }));
        it('should encrypt password before storing in database', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange - Use unique email to avoid conflicts
            const userData = (0, testUtils_1.createTestUserData)({
                email: `encrypt-test-${Date.now()}@example.com`
            });
            // Act
            yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(201);
            // Assert - Verify password is encrypted before storage
            const isHashed = yield (0, testUtils_1.verifyPasswordIsHashed)(userData.email, userData.password);
            expect(isHashed).toBe(true);
        }));
    });
    describe('Validation - Missing required fields', () => {
        it('should return 400 when firstName is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = (0, testUtils_1.createTestUserData)();
            delete userData.firstName;
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('firstName');
        }));
        it('should return 400 when lastName is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = (0, testUtils_1.createTestUserData)();
            delete userData.lastName;
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('lastName');
        }));
        it('should return 400 when email is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = (0, testUtils_1.createTestUserData)();
            delete userData.email;
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('email');
        }));
        it('should return 400 when password is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = (0, testUtils_1.createTestUserData)();
            delete userData.password;
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('password');
        }));
        it('should return 400 when multiple fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = {
                firstName: 'John',
                // lastName, email, password missing
            };
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('lastName');
            expect(response.body.message).toContain('email');
            expect(response.body.message).toContain('password');
        }));
    });
    describe('Validation - Email conflict', () => {
        it('should return 409 when email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange - Create a user first
            const existingEmail = 'existing@test.com';
            yield (0, testUtils_1.createUserInDatabase)({ email: existingEmail });
            const newUserData = (0, testUtils_1.createTestUserData)({ email: existingEmail });
            // Act - Try to register with the same email
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(newUserData)
                .expect(409);
            // Assert
            expect(response.body).toHaveProperty('error', 'Conflict');
            expect(response.body.message).toContain('Email already in use');
        }));
        it('should allow registration with different email', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            yield (0, testUtils_1.createUserInDatabase)({ email: 'existing@test.com' });
            const newUserData = (0, testUtils_1.createTestUserData)({ email: 'new@test.com' });
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(newUserData)
                .expect(201);
            // Assert
            expect(response.body.email).toBe('new@test.com');
        }));
    });
    describe('Edge cases', () => {
        it('should handle empty string fields as missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const userData = {
                firstName: '',
                lastName: 'Doe',
                email: 'test@test.com',
                password: 'Test1234!',
            };
            // Act
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(400);
            // Assert
            expect(response.body).toHaveProperty('error', 'BadRequest');
            expect(response.body.message).toContain('firstName');
        }));
    });
});
