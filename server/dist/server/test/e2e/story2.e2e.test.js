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
const app_1 = require("../../src/app");
const testSetup_1 = require("../helpers/testSetup");
const testUtils_1 = require("../helpers/testUtils");
const app = (0, app_1.createApp)();
/**
 * Story 2 E2E Tests - Administrator Managing Municipality Users
 *
 * This test suite validates the complete administrator workflow for managing municipality users:
 * 1. Admin logs in
 * 2. Admin creates a new municipality user
 * 3. Admin retrieves the list of municipality users
 * 4. Admin gets details of a specific municipality user
 * 5. Admin deletes a municipality user
 */
describe('Story 2 E2E - Administrator Managing Municipality Users', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    describe('Complete Admin Workflow: Login → Create → List → Get → Delete', () => {
        it('should complete the full municipality user management lifecycle', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup: Create an admin user
            const adminEmail = `admin${Date.now()}@example.com`;
            const adminPassword = 'AdminPass123!';
            yield (0, testUtils_1.createUserInDatabase)({
                email: adminEmail,
                first_name: 'Admin',
                last_name: 'User',
                password: adminPassword,
                role: 'ADMINISTRATOR',
            });
            // Step 1: Admin Login
            console.log('Step 1: Admin logging in...');
            const agent = supertest_1.default.agent(app);
            const loginResponse = yield agent
                .post('/api/session')
                .send({
                email: adminEmail,
                password: adminPassword,
            })
                .expect(200);
            expect(loginResponse.body.user.role).toBe('ADMINISTRATOR');
            console.log('✓ Admin logged in successfully');
            // Step 2: Create Municipality User (PUBLIC_RELATIONS)
            console.log('Step 2: Creating a PUBLIC_RELATIONS user...');
            const newMunicipalityUser = {
                firstName: 'John',
                lastName: 'PR',
                email: `pr${Date.now()}@municipality.gov`,
                password: 'PRPass123!',
                role: 'PUBLIC_RELATIONS',
            };
            const createResponse = yield agent
                .post('/api/admin/municipality-users')
                .send(newMunicipalityUser)
                .expect(201);
            expect(createResponse.body).toHaveProperty('id');
            expect(createResponse.body.email).toBe(newMunicipalityUser.email);
            expect(createResponse.body.role).toBe('PUBLIC_RELATIONS');
            const userId = createResponse.body.id;
            console.log('✓ PUBLIC_RELATIONS user created successfully');
            // Step 3: List All Municipality Users
            console.log('Step 3: Retrieving list of municipality users...');
            const listResponse = yield agent
                .get('/api/admin/municipality-users')
                .expect(200);
            expect(Array.isArray(listResponse.body)).toBe(true);
            expect(listResponse.body.length).toBeGreaterThan(0);
            const createdUser = listResponse.body.find((u) => u.id === userId);
            expect(createdUser).toBeDefined();
            expect(createdUser.email).toBe(newMunicipalityUser.email);
            console.log(`✓ Retrieved ${listResponse.body.length} municipality user(s)`);
            // Step 4: Get Specific Municipality User
            console.log('Step 4: Getting details of specific user...');
            const getResponse = yield agent
                .get(`/api/admin/municipality-users/${userId}`)
                .expect(200);
            expect(getResponse.body.id).toBe(userId);
            expect(getResponse.body.email).toBe(newMunicipalityUser.email);
            expect(getResponse.body.firstName).toBe(newMunicipalityUser.firstName);
            console.log('✓ User details retrieved successfully');
            // Step 5: Delete Municipality User
            console.log('Step 5: Deleting the municipality user...');
            yield agent
                .delete(`/api/admin/municipality-users/${userId}`)
                .expect(204); // 204 No Content is correct for successful deletion
            console.log('✓ User deleted successfully');
            // Step 6: Verify Deletion
            console.log('Step 6: Verifying user was deleted...');
            yield agent
                .get(`/api/admin/municipality-users/${userId}`)
                .expect(404);
            console.log('✓ User deletion verified');
            console.log('🎉 Complete admin workflow test passed!');
        }));
        it('should create and manage multiple municipality users with different roles', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup: Create admin
            const adminEmail = `admin${Date.now()}@example.com`;
            const adminPassword = 'AdminPass123!';
            yield (0, testUtils_1.createUserInDatabase)({
                email: adminEmail,
                first_name: 'Admin',
                last_name: 'User',
                password: adminPassword,
                role: 'ADMINISTRATOR',
            });
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({ email: adminEmail, password: adminPassword })
                .expect(200);
            // Create users with different roles
            const roles = ['PUBLIC_RELATIONS', 'MUNICIPAL_BUILDING_MAINTENANCE'];
            const createdUserIds = [];
            for (const role of roles) {
                console.log(`Creating ${role} user...`);
                const userData = {
                    firstName: 'Test',
                    lastName: role,
                    email: `${role.toLowerCase()}${Date.now()}@municipality.gov`,
                    password: 'Pass123!',
                    role: role,
                };
                const response = yield agent
                    .post('/api/admin/municipality-users')
                    .send(userData)
                    .expect(201);
                expect(response.body.role).toBe(role);
                createdUserIds.push(response.body.id);
                console.log(`✓ ${role} user created`);
                // Small delay to ensure unique timestamps
                yield new Promise(resolve => setTimeout(resolve, 50));
            }
            // Verify all users are in the list
            const listResponse = yield agent
                .get('/api/admin/municipality-users')
                .expect(200);
            expect(listResponse.body.length).toBeGreaterThanOrEqual(roles.length);
            for (const userId of createdUserIds) {
                const user = listResponse.body.find((u) => u.id === userId);
                expect(user).toBeDefined();
            }
            console.log('✓ All users verified in the list');
        }));
    });
    describe('Authorization and Access Control', () => {
        it('should prevent non-admin users from accessing admin endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a regular citizen user
            const citizenEmail = `citizen${Date.now()}@example.com`;
            const citizenPassword = 'CitizenPass123!';
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Regular',
                last_name: 'Citizen',
                password: citizenPassword,
                role: 'CITIZEN',
            });
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({ email: citizenEmail, password: citizenPassword })
                .expect(200);
            // Try to access admin endpoints
            yield agent
                .get('/api/admin/municipality-users')
                .expect(403);
            yield agent
                .post('/api/admin/municipality-users')
                .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                password: 'Pass123!',
                role: 'PUBLIC_RELATIONS',
            })
                .expect(403);
            console.log('✓ Non-admin access correctly denied');
        }));
        it('should require authentication for admin endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            // Try to access without login
            yield (0, supertest_1.default)(app)
                .get('/api/admin/municipality-users')
                .expect(401);
            yield (0, supertest_1.default)(app)
                .post('/api/admin/municipality-users')
                .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                password: 'Pass123!',
                role: 'PUBLIC_RELATIONS',
            })
                .expect(401);
            console.log('✓ Unauthenticated access correctly denied');
        }));
    });
    describe('Data Validation', () => {
        let adminAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create and login as admin
            const adminEmail = `admin${Date.now()}@example.com`;
            const adminPassword = 'AdminPass123!';
            yield (0, testUtils_1.createUserInDatabase)({
                email: adminEmail,
                first_name: 'Admin',
                last_name: 'User',
                password: adminPassword,
                role: 'ADMINISTRATOR',
            });
            adminAgent = supertest_1.default.agent(app);
            yield adminAgent
                .post('/api/session')
                .send({ email: adminEmail, password: adminPassword })
                .expect(200);
        }));
        it('should reject creation with missing required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const incompleteData = {
                firstName: 'John',
                // Missing lastName, email, password, role
            };
            const response = yield adminAgent
                .post('/api/admin/municipality-users')
                .send(incompleteData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Incomplete data correctly rejected');
        }));
        it('should reject creation with invalid role', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                email: `test${Date.now()}@municipality.gov`,
                password: 'Pass123!',
                role: 'INVALID_ROLE',
            };
            const response = yield adminAgent
                .post('/api/admin/municipality-users')
                .send(invalidData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Invalid role correctly rejected');
        }));
        it('should reject duplicate email addresses', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: `duplicate${Date.now()}@municipality.gov`,
                password: 'Pass123!',
                role: 'PUBLIC_RELATIONS',
            };
            // First creation should succeed
            yield adminAgent
                .post('/api/admin/municipality-users')
                .send(userData)
                .expect(201);
            // Second creation with same email should fail
            const response = yield adminAgent
                .post('/api/admin/municipality-users')
                .send(userData)
                .expect(409);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Duplicate email correctly rejected');
        }));
        it('should reject deletion of non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const nonExistentId = 999999;
            const response = yield adminAgent
                .delete(`/api/admin/municipality-users/${nonExistentId}`)
                .expect(404);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Deletion of non-existent user correctly rejected');
        }));
    });
    describe('Role Management', () => {
        let adminAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const adminEmail = `admin${Date.now()}@example.com`;
            const adminPassword = 'AdminPass123!';
            yield (0, testUtils_1.createUserInDatabase)({
                email: adminEmail,
                first_name: 'Admin',
                last_name: 'User',
                password: adminPassword,
                role: 'ADMINISTRATOR',
            });
            adminAgent = supertest_1.default.agent(app);
            yield adminAgent
                .post('/api/session')
                .send({ email: adminEmail, password: adminPassword })
                .expect(200);
        }));
        it('should retrieve list of available roles', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield adminAgent
                .get('/api/admin/roles')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toContain('PUBLIC_RELATIONS');
            expect(response.body).toContain('MUNICIPAL_BUILDING_MAINTENANCE');
            // ADMINISTRATOR and CITIZEN are not in municipality roles list
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            console.log(`✓ Retrieved ${response.body.length} municipality roles`);
        }));
        it('should only allow creating municipality roles (not CITIZEN)', () => __awaiter(void 0, void 0, void 0, function* () {
            const citizenData = {
                firstName: 'Test',
                lastName: 'Citizen',
                email: `testcitizen${Date.now()}@example.com`,
                password: 'Pass123!',
                role: 'CITIZEN',
            };
            const response = yield adminAgent
                .post('/api/admin/municipality-users')
                .send(citizenData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ CITIZEN role correctly rejected for municipality user');
        }));
    });
});
