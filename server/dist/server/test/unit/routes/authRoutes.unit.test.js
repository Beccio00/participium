"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authRoutes_1 = __importDefault(require("../../../src/routes/authRoutes"));
const authController_1 = require("../../../src/controllers/authController");
// Mock dei controller
jest.mock("../../../src/controllers/authController");
const mockLogin = authController_1.login;
const mockLogout = authController_1.logout;
const mockGetSessionInfo = authController_1.getSessionInfo;
describe("authRoutes", () => {
    it("should export a router", () => {
        expect(authRoutes_1.default).toBeDefined();
        expect(authRoutes_1.default).toBeInstanceOf(Function); // express.Router is a function
    });
    it("should have POST route for /", () => {
        const stack = authRoutes_1.default.stack;
        expect(stack).toBeDefined();
        expect(stack.length).toBeGreaterThan(0);
        const postRoute = stack.find((layer) => layer.route && layer.route.path === "/" && layer.route.methods.post);
        expect(postRoute).toBeDefined();
        expect(postRoute.route.stack[0].handle).toBeInstanceOf(Function);
    });
    it("should have DELETE route for /current", () => {
        const stack = authRoutes_1.default.stack;
        const deleteRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/current" &&
            layer.route.methods.delete);
        expect(deleteRoute).toBeDefined();
        expect(deleteRoute.route.stack[0].handle).toBeInstanceOf(Function);
    });
    it("should have GET route for /current", () => {
        const stack = authRoutes_1.default.stack;
        const getRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/current" &&
            layer.route.methods.get);
        expect(getRoute).toBeDefined();
        expect(getRoute.route.stack[0].handle).toBeInstanceOf(Function);
    });
});
