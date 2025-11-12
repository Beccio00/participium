"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminRoutes_1 = __importDefault(require("../../../src/routes/adminRoutes"));
const routeProtection_1 = require("../../../src/middleware/routeProtection");
const municipalityController_1 = require("../../../src/controllers/municipalityController");
jest.mock("../../../src/controllers/municipalityController");
describe("adminRoutes", () => {
    it("should export a router", () => {
        expect(adminRoutes_1.default).toBeDefined();
        expect(adminRoutes_1.default).toBeInstanceOf(Function);
    });
    it("should apply requireAdmin middleware and expose municipality routes", () => {
        const stack = adminRoutes_1.default.stack;
        expect(stack).toBeDefined();
        // requireAdmin should be used as first middleware
        const middlewareLayer = stack.find((layer) => layer.handle === routeProtection_1.requireAdmin);
        expect(middlewareLayer).toBeDefined();
        // check POST /municipality-users
        const postRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.post);
        expect(postRoute).toBeDefined();
        expect(postRoute.route.stack[0].handle).toBe(municipalityController_1.createMunicipalityUserController);
        // check GET /municipality-users
        const getRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.get);
        expect(getRoute).toBeDefined();
        expect(getRoute.route.stack[0].handle).toBe(municipalityController_1.listMunicipalityUsersController);
        // check other routes present
        const getById = stack.find((layer) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.get);
        expect(getById).toBeDefined();
        expect(getById.route.stack[0].handle).toBe(municipalityController_1.getMunicipalityUserController);
        const putRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.put);
        expect(putRoute).toBeDefined();
        expect(putRoute.route.stack[0].handle).toBe(municipalityController_1.updateMunicipalityUserController);
        const deleteRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.delete);
        expect(deleteRoute).toBeDefined();
        expect(deleteRoute.route.stack[0].handle).toBe(municipalityController_1.deleteMunicipalityUserController);
    });
});
