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
// Municipality User Role Management - User Story 935
describe('GET /api/admin/municipality-users', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should list municipality users', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and municipality user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const munUserEmail = `mun-${Date.now()}@comune.torino.it`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        yield (0, testUtils_1.createUserInDatabase)({
            email: munUserEmail,
            password: 'Mun123!',
            role: 'PUBLIC_RELATIONS'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .get('/api/admin/municipality-users')
            .expect(200);
        // Assert
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('role', 'PUBLIC_RELATIONS');
        expect(response.body[0]).toHaveProperty('email', munUserEmail);
        expect(response.body[0]).not.toHaveProperty('password');
    }));
    it('should return empty array when no municipality users exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin only
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .get('/api/admin/municipality-users')
            .expect(200);
        // Assert
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(0);
    }));
    it('should return 401 when not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
        // Act
        const response = yield (0, supertest_1.default)(app)
            .get('/api/admin/municipality-users')
            .expect(401);
        // Assert
        expect(response.body).toHaveProperty('error', 'Unauthorized');
    }));
});
describe('GET /api/admin/municipality-users/:id', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should get municipality user by id', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and municipality user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const munUser = yield (0, testUtils_1.createUserInDatabase)({
            email: `mun-${Date.now()}@comune.torino.it`,
            password: 'Mun123!',
            role: 'PUBLIC_RELATIONS'
        });
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .get(`/api/admin/municipality-users/${munUser.id}`)
            .expect(200);
        // Assert
        expect(response.body).toHaveProperty('id', munUser.id);
        expect(response.body).toHaveProperty('role', 'PUBLIC_RELATIONS');
        expect(response.body).not.toHaveProperty('password');
    }));
    it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        yield agent
            .get('/api/admin/municipality-users/999999')
            .expect(404);
    }));
    it('should return 401 when not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
        // Act
        yield (0, supertest_1.default)(app)
            .get('/api/admin/municipality-users/1')
            .expect(401);
    }));
});
describe('GET /api/admin/roles', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should return municipality roles', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .get('/api/admin/roles')
            .expect(200);
        // Assert: response should include municipality roles and exclude ADMINISTRATOR
        expect(response.body).toEqual(expect.any(Array));
        expect(response.body).toEqual(expect.arrayContaining(['PUBLIC_RELATIONS']));
        expect(response.body).not.toContain('ADMINISTRATOR');
    }));
    it('should return 401 when not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
        // Act
        yield (0, supertest_1.default)(app)
            .get('/api/admin/roles')
            .expect(401);
    }));
});
describe('DELETE /api/admin/municipality-users/:id', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should successfully delete municipality user', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and municipality user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const munUserEmail = `mun-${Date.now()}@comune.torino.it`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const munUser = yield (0, testUtils_1.createUserInDatabase)({
            email: munUserEmail,
            password: 'Mun123!',
            role: 'PUBLIC_RELATIONS'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        yield agent
            .delete(`/api/admin/municipality-users/${munUser.id}`)
            .expect(204);
        // Assert - verify user is deleted
        const listResponse = yield agent
            .get('/api/admin/municipality-users')
            .expect(200);
        expect(listResponse.body).toBeInstanceOf(Array);
        expect(listResponse.body.length).toBe(0);
    }));
    it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .delete('/api/admin/municipality-users/999999')
            .expect(404);
        // Assert
        expect(response.body).toHaveProperty('error', 'NotFound');
    }));
    it('should return 401 when not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
        // Act
        const response = yield (0, supertest_1.default)(app)
            .delete('/api/admin/municipality-users/1')
            .expect(401);
        // Assert
        expect(response.body).toHaveProperty('error', 'Unauthorized');
    }));
});
describe('Authentication error handling', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should handle authentication errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Test Case 1: Login with non-existent municipality user
        const nonExistentResponse = yield (0, supertest_1.default)(app)
            .post('/api/session')
            .send({
            email: 'nonexistent@comune.torino.it',
            password: 'Municipal123!'
        })
            .expect(401);
        expect(nonExistentResponse.body).toHaveProperty('error', 'Unauthorized');
        expect(nonExistentResponse.body.message).toContain('Invalid username or password');
        // Test Case 2: Login with wrong password
        const municipalityUser = yield (0, testUtils_1.createUserInDatabase)({
            email: `auth-test-${Date.now()}@comune.torino.it`,
            password: 'Municipal123!',
            role: 'PUBLIC_RELATIONS'
        });
        const wrongPasswordResponse = yield (0, supertest_1.default)(app)
            .post('/api/session')
            .send({
            email: municipalityUser.email,
            password: 'WrongPassword123!'
        })
            .expect(401);
        expect(wrongPasswordResponse.body).toHaveProperty('error', 'Unauthorized');
        expect(wrongPasswordResponse.body.message).toContain('Invalid username or password');
        // Test Case 3: Valid login and session check
        const agent = supertest_1.default.agent(app);
        const validLoginResponse = yield agent
            .post('/api/session')
            .send({
            email: municipalityUser.email,
            password: 'Municipal123!'
        })
            .expect(200);
        expect(validLoginResponse.body).toHaveProperty('message', 'Login successful');
        // Verify session endpoint works
        const sessionResponse = yield agent
            .get('/api/session/current')
            .expect(200);
        expect(sessionResponse.body).toHaveProperty('authenticated');
    }));
});
describe('Error scenarios coverage tests', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should return 400 when creating user with missing password', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@comune.torino.it',
            role: 'PUBLIC_RELATIONS'
        })
            .expect(400);
        // Assert
        expect(response.body).toHaveProperty('error', 'BadRequest');
        expect(response.body.message).toContain('password');
    }));
    it('should return 400 when getting user with invalid ID format', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin
        const adminEmail = `admin-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act
        const response = yield agent
            .get('/api/admin/municipality-users/invalid-id')
            .expect(400);
        // Assert
        expect(response.body).toHaveProperty('error', 'BadRequest');
    }));
});
describe('Service coverage integration tests', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should handle duplicate email through API', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and municipality user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const munUserEmail = `existing-${Date.now()}@comune.torino.it`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        yield (0, testUtils_1.createUserInDatabase)({
            email: munUserEmail,
            password: 'Mun123!',
            role: 'PUBLIC_RELATIONS'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act - try to create user with existing municipality email
        const response = yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'Test',
            lastName: 'User',
            email: munUserEmail,
            password: 'Test123!',
            role: 'MUNICIPAL_BUILDING_MAINTENANCE'
        })
            .expect(409);
        // Assert
        expect(response.body).toHaveProperty('error', 'Conflict');
    }));
    it('should return 404 for citizen user ID in municipality endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and citizen user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const citizen = yield (0, testUtils_1.createUserInDatabase)({
            email: citizenEmail,
            password: 'Citizen123!',
            role: 'CITIZEN'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act - try to get citizen through municipality user endpoint
        const response = yield agent
            .get(`/api/admin/municipality-users/${citizen.id}`)
            .expect(404);
        // Assert
        expect(response.body).toHaveProperty('error', 'NotFound');
    }));
    it('should return 404 when trying to delete citizen through municipality endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin and citizen user
        const adminEmail = `admin-${Date.now()}@example.com`;
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({
            email: adminEmail,
            password: 'Admin1234!',
            role: 'ADMINISTRATOR'
        });
        const citizen = yield (0, testUtils_1.createUserInDatabase)({
            email: citizenEmail,
            password: 'Citizen123!',
            role: 'CITIZEN'
        });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: 'Admin1234!' })
            .expect(200);
        // Act - try to delete citizen through municipality user endpoint
        const response = yield agent
            .delete(`/api/admin/municipality-users/${citizen.id}`)
            .expect(404);
        // Assert
        expect(response.body).toHaveProperty('error', 'NotFound');
    }));
});
