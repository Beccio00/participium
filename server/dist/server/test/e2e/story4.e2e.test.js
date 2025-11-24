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
 * Story 4 E2E Tests - Citizen Report System
 *
 * This test suite validates the complete citizen report workflow:
 * 1. Citizen registers and logs in
 * 2. Citizen creates a report with photos and location
 * 3. Citizen views their reports
 * 4. Report goes through approval workflow
 * 5. Approved reports are publicly visible
 */
describe('Story 4 E2E - Citizen Report System', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.cleanDatabase)();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, testSetup_1.disconnectDatabase)();
    }));
    describe('Complete Report Lifecycle: Register → Login → Create Report → View Reports', () => {
        it('should complete the full citizen report workflow', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            // Step 1: Citizen Registration
            console.log('Step 1: Citizen registering...');
            const citizenData = {
                firstName: 'Maria',
                lastName: 'Rossi',
                email: `maria.rossi${timestamp}@example.com`,
                password: 'SecurePass123!',
            };
            const signupResponse = yield (0, supertest_1.default)(app)
                .post('/api/citizen/signup')
                .send(citizenData)
                .expect(201);
            expect(signupResponse.body.email).toBe(citizenData.email);
            console.log('✓ Citizen registered successfully');
            yield new Promise(resolve => setTimeout(resolve, 300));
            // Step 2: Citizen Login
            console.log('Step 2: Citizen logging in...');
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({
                email: citizenData.email,
                password: citizenData.password,
            })
                .expect(200);
            console.log('✓ Citizen logged in');
            // Step 3: Create Report with Photos
            console.log('Step 3: Creating report with photos...');
            const reportData = {
                title: 'Pothole on Via Roma',
                description: 'Large pothole causing danger to vehicles and pedestrians',
                category: 'ROADS_URBAN_FURNISHINGS',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/pothole1.jpg',
                        filename: 'pothole1.jpg',
                    },
                    {
                        id: 2,
                        url: 'https://example.com/pothole2.jpg',
                        filename: 'pothole2.jpg',
                    },
                ],
            };
            const createResponse = yield agent
                .post('/api/reports')
                .send(reportData)
                .expect(201);
            expect(createResponse.body).toHaveProperty('id');
            expect(createResponse.body.message).toBe('Report created successfully');
            const reportId = createResponse.body.id;
            console.log(`✓ Report created successfully (ID: ${reportId})`);
            // Step 4: Verify Report is Pending Approval (not visible in public list)
            console.log('Step 4: Verifying report is pending approval...');
            const reportsResponse = yield agent
                .get('/api/reports')
                .expect(200);
            expect(Array.isArray(reportsResponse.body)).toBe(true);
            const foundReport = reportsResponse.body.find((r) => r.id === reportId);
            expect(foundReport).toBeUndefined(); // Pending reports should not be in public list
            console.log('✓ Report correctly pending approval (not in public list)');
            console.log('🎉 Complete citizen report workflow test passed!');
        }));
        it('should handle multiple reports from the same citizen', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            // Setup: Register and login citizen
            const citizenEmail = `multi.report${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Multi',
                last_name: 'Reporter',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
            // Create multiple reports
            const categories = [
                'ROADS_URBAN_FURNISHINGS',
                'PUBLIC_LIGHTING',
                'WASTE',
            ];
            const reportIds = [];
            for (const category of categories) {
                console.log(`Creating report for category: ${category}...`);
                const response = yield agent
                    .post('/api/reports')
                    .send({
                    title: `Issue with ${category}`,
                    description: `Report about ${category}`,
                    category: category,
                    latitude: 45.0700 + Math.random() * 0.01,
                    longitude: 7.6860 + Math.random() * 0.01,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: `https://example.com/${category}.jpg`,
                            filename: `${category}.jpg`,
                        },
                    ],
                })
                    .expect(201);
                reportIds.push(response.body.id);
                console.log(`✓ Report ${response.body.id} created for ${category}`);
                yield new Promise(resolve => setTimeout(resolve, 100));
            }
            expect(reportIds.length).toBe(3);
            console.log('✓ All three reports created successfully');
        }));
        it('should handle anonymous report submission', () => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            // Setup citizen
            const citizenEmail = `anon${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Anonymous',
                last_name: 'Citizen',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            const agent = supertest_1.default.agent(app);
            yield agent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
            // Create anonymous report
            console.log('Creating anonymous report...');
            const response = yield agent
                .post('/api/reports')
                .send({
                title: 'Anonymous Issue Report',
                description: 'I prefer to remain anonymous',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: true,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/anonymous.jpg',
                        filename: 'anonymous.jpg',
                    },
                ],
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            console.log('✓ Anonymous report created successfully');
        }));
    });
    describe('Report Categories', () => {
        let citizenAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const citizenEmail = `category${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Category',
                last_name: 'Tester',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            citizenAgent = supertest_1.default.agent(app);
            yield citizenAgent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
        }));
        it('should accept all valid report categories', () => __awaiter(void 0, void 0, void 0, function* () {
            const validCategories = [
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
            for (const category of validCategories) {
                console.log(`Testing category: ${category}...`);
                const response = yield citizenAgent
                    .post('/api/reports')
                    .send({
                    title: `Test report for ${category}`,
                    description: `Testing category: ${category}`,
                    category: category,
                    latitude: 45.0704,
                    longitude: 7.6870,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: `https://example.com/${category}.jpg`,
                            filename: `${category}.jpg`,
                        },
                    ],
                })
                    .expect(201);
                expect(response.body).toHaveProperty('id');
                console.log(`✓ Category ${category} accepted`);
                yield new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log('✓ All 9 categories validated successfully');
        }));
        it('should reject invalid categories', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidCategory = 'INVALID_CATEGORY';
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Test with invalid category',
                description: 'This should fail',
                category: invalidCategory,
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/test.jpg',
                        filename: 'test.jpg',
                    },
                ],
            })
                .expect(500); // Backend validation error
            console.log('✓ Invalid category correctly rejected');
        }));
    });
    describe('Location Data', () => {
        let citizenAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const citizenEmail = `location${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Location',
                last_name: 'Tester',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            citizenAgent = supertest_1.default.agent(app);
            yield citizenAgent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
        }));
        it('should accept valid GPS coordinates', () => __awaiter(void 0, void 0, void 0, function* () {
            const validCoordinates = [
                { lat: 45.0704, lng: 7.6870, name: 'Turin center' },
                { lat: 0, lng: 0, name: 'Equator/Prime Meridian' },
                { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
                { lat: 40.7128, lng: -74.0060, name: 'New York' },
            ];
            for (const coord of validCoordinates) {
                console.log(`Testing coordinates: ${coord.name}...`);
                const response = yield citizenAgent
                    .post('/api/reports')
                    .send({
                    title: `Report at ${coord.name}`,
                    description: `Testing coordinates: ${coord.lat}, ${coord.lng}`,
                    category: 'OTHER',
                    latitude: coord.lat,
                    longitude: coord.lng,
                    isAnonymous: false,
                    photos: [
                        {
                            id: 1,
                            url: 'https://example.com/location.jpg',
                            filename: 'location.jpg',
                        },
                    ],
                })
                    .expect(201);
                expect(response.body).toHaveProperty('id');
                console.log(`✓ Coordinates ${coord.name} accepted`);
                yield new Promise(resolve => setTimeout(resolve, 50));
            }
        }));
        it('should reject missing location data', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Report without location',
                description: 'Missing latitude and longitude',
                category: 'OTHER',
                // latitude and longitude missing
                isAnonymous: false,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/test.jpg',
                        filename: 'test.jpg',
                    },
                ],
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Missing location data correctly rejected');
        }));
    });
    describe('Photo Requirements', () => {
        let citizenAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const citizenEmail = `photo${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Photo',
                last_name: 'Tester',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            citizenAgent = supertest_1.default.agent(app);
            yield citizenAgent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
        }));
        it('should accept report with single photo', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Report with one photo',
                description: 'Testing single photo',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/single.jpg',
                        filename: 'single.jpg',
                    },
                ],
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            console.log('✓ Single photo accepted');
        }));
        it('should accept report with multiple photos', () => __awaiter(void 0, void 0, void 0, function* () {
            const photos = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                url: `https://example.com/photo${i + 1}.jpg`,
                filename: `photo${i + 1}.jpg`,
            }));
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Report with multiple photos',
                description: 'Testing multiple photos',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: photos,
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            console.log(`✓ Multiple photos (${photos.length}) accepted`);
        }));
        it('should reject report without photos', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Report without photos',
                description: 'Missing photos',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                // photos field missing entirely
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Report without photos field correctly rejected');
        }));
    });
    describe('Authentication Requirements', () => {
        it('should require login to create report', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/reports')
                .send({
                title: 'Unauthorized report',
                description: 'Trying without login',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [
                    {
                        id: 1,
                        url: 'https://example.com/test.jpg',
                        filename: 'test.jpg',
                    },
                ],
            })
                .expect(401);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Unauthenticated report creation correctly denied');
        }));
        it('should require login to view reports', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/reports')
                .expect(401);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Unauthenticated report viewing correctly denied');
        }));
    });
    describe('Data Validation', () => {
        let citizenAgent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const timestamp = Date.now();
            const citizenEmail = `validation${timestamp}@example.com`;
            yield (0, testUtils_1.createUserInDatabase)({
                email: citizenEmail,
                first_name: 'Validation',
                last_name: 'Tester',
                password: 'Pass123!',
                role: 'CITIZEN',
            });
            citizenAgent = supertest_1.default.agent(app);
            yield citizenAgent
                .post('/api/session')
                .send({ email: citizenEmail, password: 'Pass123!' })
                .expect(200);
        }));
        it('should reject report with missing title', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                // title missing
                description: 'Valid description',
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Missing title correctly rejected');
        }));
        it('should reject report with missing description', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Valid title',
                // description missing
                category: 'OTHER',
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Missing description correctly rejected');
        }));
        it('should reject report with missing category', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield citizenAgent
                .post('/api/reports')
                .send({
                title: 'Valid title',
                description: 'Valid description',
                // category missing
                latitude: 45.0704,
                longitude: 7.6870,
                isAnonymous: false,
                photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
            console.log('✓ Missing category correctly rejected');
        }));
    });
});
