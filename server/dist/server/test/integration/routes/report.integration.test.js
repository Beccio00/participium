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
describe('Report Integration Tests', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
        jest.clearAllMocks();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    describe('POST /api/reports - Create Report', () => {
        describe('Success scenarios', () => {
            it('should successfully create a report with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange - Create a citizen user
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                // Login to get session
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Broken street light',
                    description: 'The street light on Main St is not working',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo1.jpg',
                            filename: 'photo1.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('message', 'Report created successfully');
                expect(response.body).toHaveProperty('id');
                expect(typeof response.body.id).toBe('number');
            }));
            it('should create an anonymous report', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Pothole on road',
                    description: 'Large pothole needs fixing',
                    category: 'ROADS_URBAN_FURNISHINGS',
                    latitude: 45.0704,
                    longitude: 7.6870,
                    isAnonymous: true, // Anonymous report
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/pothole.jpg',
                            filename: 'pothole.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('id');
            }));
            it('should create report with multiple photos', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Damaged playground',
                    description: 'Playground equipment is damaged and unsafe',
                    category: 'PUBLIC_GREEN_AREAS_PLAYGROUNDS',
                    latitude: 45.0705,
                    longitude: 7.6871,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo1.jpg',
                            filename: 'photo1.jpg',
                        },
                        {
                            id: 2,
                            url: 'https://example.com/photo2.jpg',
                            filename: 'photo2.jpg',
                        },
                        {
                            id: 3,
                            url: 'https://example.com/photo3.jpg',
                            filename: 'photo3.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('id');
            }));
            it('should create report with all valid categories', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const categories = [
                    'WATER_SUPPLY_DRINKING_WATER',
                    'ARCHITECTURAL_BARRIERS',
                    'SEWER_SYSTEM',
                    'PUBLIC_LIGHTING',
                    'WASTE',
                    'ROAD_SIGNS_TRAFFIC_LIGHTS',
                    'ROADS_URBAN_FURNISHINGS',
                    'PUBLIC_GREEN_AREAS_PLAYGROUNDS',
                    'OTHER',
                ];
                // Act & Assert - Test each category
                for (const category of categories) {
                    const reportData = {
                        title: `Test report for ${category}`,
                        description: `Testing category: ${category}`,
                        category: category,
                        latitude: 45.0703,
                        longitude: 7.6869,
                        isAnonymous: false,
                        photos: [
                            {
                                id: 1,
                                url: 'https://example.com/test.jpg',
                                filename: 'test.jpg',
                            },
                        ],
                    };
                    const response = yield agent.post('/api/reports').send(reportData);
                    expect(response.status).toBe(201);
                    expect(response.body).toHaveProperty('id');
                }
            }));
        });
        describe('Validation - Missing required fields', () => {
            it('should return 400 when title is missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    // title: missing
                    description: 'Test description',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
                expect(response.body).toHaveProperty('message', 'Missing required fields');
            }));
            it('should return 400 when description is missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    // description: missing
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
            it('should return 400 when category is missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    description: 'Test description',
                    // category: missing
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
            it('should return 400 when latitude is missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    description: 'Test description',
                    category: 'PUBLIC_LIGHTING',
                    // latitude: missing
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
            it('should return 400 when longitude is missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    description: 'Test description',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    // longitude: missing
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
            it('should return 400 when photos are missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    description: 'Test description',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    // photos: missing
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
            it('should return 400 when multiple fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    // title: missing
                    // description: missing
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    // photos: missing
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Bad Request');
            }));
        });
        describe('Authentication scenarios', () => {
            it('should return 401 when not logged in', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const reportData = {
                    title: 'Test report',
                    description: 'Test description',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act - No login, direct request
                const response = yield (0, supertest_1.default)(app)
                    .post('/api/reports')
                    .send(reportData);
                // Assert
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error', 'Unauthorized');
            }));
        });
        describe('Edge cases', () => {
            it('should handle latitude and longitude as 0', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report at 0,0',
                    description: 'Testing edge case',
                    category: 'OTHER',
                    latitude: 0, // Edge case: 0 is valid
                    longitude: 0, // Edge case: 0 is valid
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('id');
            }));
            it('should handle negative latitude and longitude', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Test report',
                    description: 'Testing negative coordinates',
                    category: 'OTHER',
                    latitude: -45.0703,
                    longitude: -7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                // Act
                const response = yield agent.post('/api/reports').send(reportData);
                // Assert
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('id');
            }));
        });
    });
    describe('GET /api/reports - Get Reports', () => {
        describe('Success scenarios', () => {
            it('should return empty array when no approved reports exist', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                // Act
                const response = yield agent.get('/api/reports');
                // Assert
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBe(0);
            }));
            it('should not return pending approval reports', () => __awaiter(void 0, void 0, void 0, function* () {
                // Arrange - Create a report (which will be in PENDING_APPROVAL status)
                const citizenEmail = `citizen-${Date.now()}@example.com`;
                yield (0, testUtils_1.createUserInDatabase)({
                    email: citizenEmail,
                    password: 'Citizen123!',
                    role: 'CITIZEN',
                });
                const agent = supertest_1.default.agent(app);
                yield agent
                    .post('/api/session')
                    .send({ email: citizenEmail, password: 'Citizen123!' })
                    .expect(200);
                const reportData = {
                    title: 'Pending report',
                    description: 'This should not be visible',
                    category: 'PUBLIC_LIGHTING',
                    latitude: 45.0703,
                    longitude: 7.6869,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/photo.jpg',
                            filename: 'photo.jpg',
                        },
                    ],
                };
                yield agent.post('/api/reports').send(reportData).expect(201);
                // Act - Get reports
                const response = yield agent.get('/api/reports');
                // Assert - Should be empty because report is in PENDING_APPROVAL status
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBe(0);
            }));
        });
        describe('Authentication scenarios', () => {
            it('should return 401 when not logged in', () => __awaiter(void 0, void 0, void 0, function* () {
                // Act - No login, direct request
                const response = yield (0, supertest_1.default)(app).get('/api/reports');
                // Assert
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error', 'Unauthorized');
            }));
        });
    });
});
