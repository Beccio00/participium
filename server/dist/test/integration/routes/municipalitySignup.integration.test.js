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
const adminRoutes_1 = __importDefault(require("../../../src/routes/adminRoutes"));
const testSetup_1 = require("../../helpers/testSetup");
const testUtils_1 = require("../../helpers/testUtils");
// test suite for POST /api/admin/municipality-users
// test the creation of a municipality user account by an authenticated admin
const app = (0, app_1.createApp)();
app.use('/api/admin', adminRoutes_1.default);
describe('POST /api/admin/municipality-users', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    it('should allow an authenticated admin to create a municipality user (happy path)', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create admin in DB
        const adminEmail = `admin-${Date.now()}@example.com`;
        const adminPassword = 'Admin1234!';
        yield (0, testUtils_1.createUserInDatabase)({ email: adminEmail, password: adminPassword, role: 'ADMINISTRATOR' });
        // Login using agent to persist session cookie
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: adminPassword })
            .expect(200);
        // Act - create municipality user
        const newEmail = `mun-${Date.now()}@example.com`;
        const response = yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'Alice',
            lastName: 'Smith',
            email: newEmail,
            password: 'Municipal123!',
            role: 'PUBLIC_RELATIONS'
        })
            .expect(201);
        // Assert
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('firstName', 'Alice');
        expect(response.body).toHaveProperty('lastName', 'Smith');
        expect(response.body).toHaveProperty('email', newEmail);
        expect(response.body).toHaveProperty('role', 'PUBLIC_RELATIONS');
    }));
    it('should return 401 when not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
        const payload = {
            firstName: 'Bob',
            lastName: 'Williams',
            email: `bob-${Date.now()}@example.com`,
            password: 'Municipal123!',
            role: 'TECHNICAL_OFFICE'
        };
        yield (0, supertest_1.default)(app)
            .post('/api/admin/municipality-users')
            .send(payload)
            .expect(401);
    }));
    it('should return 403 when authenticated but not an admin', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create a regular citizen user
        const userEmail = `user-${Date.now()}@example.com`;
        const userPassword = 'User1234!';
        yield (0, testUtils_1.createUserInDatabase)({ email: userEmail, password: userPassword, role: 'CITIZEN' });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: userEmail, password: userPassword })
            .expect(200);
        // Act
        yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'Eve',
            lastName: 'Adams',
            email: `eve-${Date.now()}@example.com`,
            password: 'Municipal123!',
            role: 'PUBLIC_RELATIONS'
        })
            .expect(403);
    }));
    it('should return 400 when required fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const adminEmail = `admin2-${Date.now()}@example.com`;
        const adminPassword = 'Admin1234!';
        yield (0, testUtils_1.createUserInDatabase)({ email: adminEmail, password: adminPassword, role: 'ADMINISTRATOR' });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: adminPassword })
            .expect(200);
        // Act - missing role
        const response = yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'NoRole',
            lastName: 'User',
            email: `norole-${Date.now()}@example.com`,
            password: 'Municipal123!'
        })
            .expect(400);
        expect(response.body).toHaveProperty('error', 'BadRequest');
    }));
    it('should return 409 when email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange - create existing user
        const existingEmail = `exists-${Date.now()}@example.com`;
        yield (0, testUtils_1.createUserInDatabase)({ email: existingEmail });
        // create admin and login
        const adminEmail = `admin3-${Date.now()}@example.com`;
        const adminPassword = 'Admin1234!';
        yield (0, testUtils_1.createUserInDatabase)({ email: adminEmail, password: adminPassword, role: 'ADMINISTRATOR' });
        const agent = supertest_1.default.agent(app);
        yield agent
            .post('/api/session')
            .send({ email: adminEmail, password: adminPassword })
            .expect(200);
        // Act - try to create municipality user with existing email
        const response = yield agent
            .post('/api/admin/municipality-users')
            .send({
            firstName: 'Conflict',
            lastName: 'User',
            email: existingEmail,
            password: 'Municipal123!',
            role: 'PUBLIC_RELATIONS'
        })
            .expect(409);
        expect(response.body).toHaveProperty('error', 'Conflict');
    }));
});
