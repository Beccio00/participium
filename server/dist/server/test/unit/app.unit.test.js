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
const express_1 = __importDefault(require("express"));
// Mock all route imports to return router instances
jest.mock('../../src/routes/authRoutes', () => express_1.default.Router());
jest.mock('../../src/routes/citizenRoutes', () => express_1.default.Router());
jest.mock('../../src/routes/adminRoutes', () => express_1.default.Router());
jest.mock('../../src/routes/reportRoutes', () => express_1.default.Router());
// Mock config and other dependencies
jest.mock('../../src/config/passport', () => ({
    configurePassport: jest.fn()
}));
jest.mock('../../prisma/generated/client');
// Import createApp after mocking
const app_1 = require("../../src/app");
describe('App', () => {
    let app;
    beforeAll(() => {
        app = (0, app_1.createApp)();
    });
    describe('Root endpoint', () => {
        it('should return API information', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/')
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('description');
            expect(response.body).toHaveProperty('endpoints');
            expect(response.body.endpoints).toHaveProperty('auth');
            expect(response.body.endpoints).toHaveProperty('citizens');
            expect(response.body.endpoints).toHaveProperty('admin');
            expect(response.body.endpoints).toHaveProperty('docs');
        }));
        it('should return correct API name', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/')
                .expect(200);
            expect(response.body.message).toBe('Participium API');
        }));
        it('should return version information', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/')
                .expect(200);
            expect(response.body.version).toBe('1.1.0');
        }));
    });
});
