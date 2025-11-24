"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminRoutes_1 = __importDefault(require("../../../src/routes/adminRoutes"));
const routeProtection_1 = require("../../../src/middleware/routeProtection");
jest.mock("../../../src/controllers/municipalityController");
describe("adminRoutes", () => {
    it("should export a router", () => {
        expect(adminRoutes_1.default).toBeDefined();
        expect(adminRoutes_1.default).toBeInstanceOf(Function);
    });
    it("should apply requireAdmin middleware and expose municipality routes", () => {
        const stack = adminRoutes_1.default.stack;
        expect(stack).toBeDefined();
        const middlewareLayer = stack.find((layer) => layer.handle === routeProtection_1.requireAdmin);
        expect(middlewareLayer).toBeDefined();
        const postRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.post);
        expect(postRoute).toBeDefined();
        expect(postRoute.route.stack[0].handle).toBeInstanceOf(Function);
        const getRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.get);
        expect(getRoute).toBeDefined();
        expect(getRoute.route.stack[0].handle).toBeInstanceOf(Function);
        const getById = stack.find((layer) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.get);
        expect(getById).toBeDefined();
        expect(getById.route.stack[0].handle).toBeInstanceOf(Function);
        const deleteRoute = stack.find((layer) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.delete);
        expect(deleteRoute).toBeDefined();
        expect(deleteRoute.route.stack[0].handle).toBeInstanceOf(Function);
        const rolesRoute = stack.find((layer) => layer.route && layer.route.path === "/roles" && layer.route.methods.get);
        expect(rolesRoute).toBeDefined();
        expect(rolesRoute.route.stack[0].handle).toBeInstanceOf(Function);
    });
});
