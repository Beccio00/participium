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
const app = (0, app_1.createApp)();
/**
 * Story 1 E2E Tests - Complete User Registration and Authentication Flow
 *
 * This test suite validates the entire user journey from registration to logout:
 * 1. User registers as a new citizen
 * 2. User logs in with credentials
 * 3. User accesses their session information
 * 4. User logs out successfully
 */
describe('Story 1 E2E - User Registration and Authentication Flow', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    describe('Complete User Journey: Register → Login → Session → Logout', () => {
        it('should complete the full user authentication lifecycle', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const userData = {
                firstName: 'Alice',
                lastName: 'Johnson',
                email: `alice${timestamp}@example.com`,
                password: 'SecurePass123!',
            };
            // Step 1: User Registration
            console.log('Step 1: Registering new user...');
            const signupResponse = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(201);
            expect(signupResponse.body).toHaveProperty('firstName', userData.firstName);
            expect(signupResponse.body).toHaveProperty('lastName', userData.lastName);
            expect(signupResponse.body).toHaveProperty('email', userData.email);
            expect(signupResponse.body).not.toHaveProperty('password'); // Password should not be returned
            console.log('✓ User registered successfully');
            // Wait a bit for database write to complete
            yield new Promise(resolve => setTimeout(resolve, 300));
            // Step 2: User Login
            console.log('Step 2: Logging in with credentials...');
            const agent = supertest_1.default.agent(app);
            const loginResponse = yield agent
                .post('/api/session')
                .send({
                email: userData.email,
                password: userData.password,
            })
                .expect(200);
            expect(loginResponse.body.user).toHaveProperty('firstName', userData.firstName);
            expect(loginResponse.body.user).toHaveProperty('email', userData.email);
            console.log('✓ User logged in successfully');
            // Step 3: Check Session Information
            console.log('Step 3: Checking session information...');
            const sessionResponse = yield agent
                .get('/api/session/current')
                .expect(200);
            expect(sessionResponse.body.authenticated).toBe(true);
            expect(sessionResponse.body.user).toHaveProperty('email', userData.email);
            expect(sessionResponse.body.user).toHaveProperty('firstName', userData.firstName);
            console.log('✓ Session information retrieved successfully');
            // Step 4: User Logout
            console.log('Step 4: Logging out...');
            yield agent
                .delete('/api/session/current')
                .expect(200);
            console.log('✓ User logged out successfully');
            // Step 5: Verify Session is Cleared
            console.log('Step 5: Verifying session is cleared...');
            const logoutSessionResponse = yield agent
                .get('/api/session/current')
                .expect(200);
            expect(logoutSessionResponse.body.authenticated).toBe(false);
            expect(logoutSessionResponse.body.user).toBeUndefined();
            console.log('✓ Session cleared successfully');
            console.log('🎉 Complete user journey test passed!');
        }));
        it('should prevent login with incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const userData = {
                firstName: 'Bob',
                lastName: 'Smith',
                email: `bob${timestamp}@example.com`,
                password: 'CorrectPass123!',
            };
            // Step 1: Register user
            yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(201);
            yield new Promise(resolve => setTimeout(resolve, 300));
            // Step 2: Try to login with wrong password
            yield (0, supertest_1.default)(app)
                .post('/api/session')
                .send({
                email: userData.email,
                password: 'WrongPassword123!',
            })
                .expect(401);
            console.log('✓ Incorrect password correctly rejected');
        }));
        it('should maintain session across multiple requests', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const userData = {
                firstName: 'Carol',
                lastName: 'Davis',
                email: `carol${timestamp}@example.com`,
                password: 'SecurePass123!',
            };
            // Register and login
            yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(201);
            yield new Promise(resolve => setTimeout(resolve, 300));
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({
                email: userData.email,
                password: userData.password,
            })
                .expect(200);
            // Make multiple requests with the same session
            for (let i = 0; i < 3; i++) {
                const response = yield agent
                    .get('/api/session/current')
                    .expect(200);
                expect(response.body.authenticated).toBe(true);
                expect(response.body.user.email).toBe(userData.email);
            }
            console.log('✓ Session maintained across multiple requests');
        }));
    });
    describe('Error Handling Scenarios', () => {
        it('should handle duplicate registration attempts', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const userData = {
                firstName: 'David',
                lastName: 'Wilson',
                email: `david${timestamp}@example.com`,
                password: 'SecurePass123!',
            };
            // First registration should succeed
            yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(201);
            // Second registration with same email should fail
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(userData)
                .expect(409);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Duplicate registration correctly prevented');
        }));
        it('should handle login before registration', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/session')
                .send({
                email: 'nonexistent@example.com',
                password: 'SomePassword123!',
            })
                .expect(401);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Login with non-existent user correctly rejected');
        }));
        it('should handle logout without login', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .delete('/api/session/current')
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Logout without login correctly rejected');
        }));
    });
    describe('Data Validation', () => {
        it('should reject registration with missing fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const incompleteData = {
                firstName: 'Eve',
                // Missing lastName, email, password
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(incompleteData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Incomplete registration data correctly rejected');
        }));
        it('should reject registration with empty email', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                firstName: 'Frank',
                lastName: 'Miller',
                email: '',
                password: 'SecurePass123!',
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(invalidData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Empty email correctly rejected');
        }));
    });
});
