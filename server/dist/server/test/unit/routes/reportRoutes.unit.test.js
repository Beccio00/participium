"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Mock dei controller e middleware - devono essere prima degli import
jest.mock("../../../src/controllers/reportController", () => ({
    createReport: jest.fn(),
    getReports: jest.fn(),
}));
jest.mock("../../../src/middleware/routeProtection", () => ({
    isLoggedIn: jest.fn(),
}));
const reportRoutes_1 = __importDefault(require("../../../src/routes/reportRoutes"));
const reportController_1 = require("../../../src/controllers/reportController");
const routeProtection_1 = require("../../../src/middleware/routeProtection");
const mockCreateReport = reportController_1.createReport;
const mockGetReports = reportController_1.getReports;
const mockIsLoggedIn = routeProtection_1.isLoggedIn;
describe("reportRoutes", () => {
    it("should export a router", () => {
        expect(reportRoutes_1.default).toBeDefined();
        expect(reportRoutes_1.default).toBeInstanceOf(Function); // express.Router is a function
    });
    it("should have POST route for /reports with authentication middleware", () => {
        const stack = reportRoutes_1.default.stack;
        expect(stack).toBeDefined();
        expect(stack.length).toBeGreaterThan(0);
        // Find the POST route for /
        const postRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.post);
        expect(postRoute).toBeDefined();
        expect(postRoute.route.stack).toHaveLength(2); // middleware + handler
        // First should be the isLoggedIn middleware
        expect(postRoute.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        // Second should be the createReport handler
        expect(postRoute.route.stack[1].handle).toBe(reportController_1.createReport);
    });
    it("should have GET route for /reports with authentication middleware", () => {
        const stack = reportRoutes_1.default.stack;
        // Find the GET route for /
        const getRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.get);
        expect(getRoute).toBeDefined();
        expect(getRoute.route.stack).toHaveLength(2); // middleware + handler
        // First should be the isLoggedIn middleware
        expect(getRoute.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        // Second should be the getReports handler
        expect(getRoute.route.stack[1].handle).toBe(reportController_1.getReports);
    });
    it("should apply isLoggedIn middleware to both routes", () => {
        const stack = reportRoutes_1.default.stack;
        // Check all routes have the isLoggedIn middleware
        const routes = stack.filter((layer) => layer.route);
        routes.forEach((route) => {
            expect(route.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        });
    });
    it("should have exactly two routes defined", () => {
        const stack = reportRoutes_1.default.stack;
        const routes = stack.filter((layer) => layer.route);
        expect(routes).toHaveLength(2);
        // Verify we have one POST and one GET
        const postRoutes = routes.filter((layer) => layer.route.methods.post);
        const getRoutes = routes.filter((layer) => layer.route.methods.get);
        expect(postRoutes).toHaveLength(1);
        expect(getRoutes).toHaveLength(1);
    });
    it("should use correct path for both routes", () => {
        const stack = reportRoutes_1.default.stack;
        const routes = stack.filter((layer) => layer.route);
        routes.forEach((route) => {
            expect(route.route.path).toBe("/");
        });
    });
    it("should have proper middleware order", () => {
        const stack = reportRoutes_1.default.stack;
        const postRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.post);
        const getRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.get);
        // Both routes should have middleware first, then handler
        [postRoute, getRoute].forEach(route => {
            expect(route.route.stack).toHaveLength(2);
            // First layer should be middleware (isLoggedIn)
            expect(route.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
            // Second layer should be the actual handler
            expect([reportController_1.createReport, reportController_1.getReports]).toContain(route.route.stack[1].handle);
        });
    });
    it("should properly configure authentication requirement for reports creation", () => {
        const stack = reportRoutes_1.default.stack;
        const postRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.post);
        // POST route should require authentication (isLoggedIn middleware)
        expect(postRoute.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        expect(postRoute.route.stack[1].handle).toBe(reportController_1.createReport);
    });
    it("should properly configure authentication requirement for reports retrieval", () => {
        const stack = reportRoutes_1.default.stack;
        const getRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.get);
        // GET route should require authentication (isLoggedIn middleware)  
        expect(getRoute.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        expect(getRoute.route.stack[1].handle).toBe(reportController_1.getReports);
    });
    it("should not have any routes without authentication", () => {
        const stack = reportRoutes_1.default.stack;
        const routes = stack.filter((layer) => layer.route);
        // All routes should have at least 2 handlers (middleware + controller)
        routes.forEach((route) => {
            expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
            // First handler should always be authentication middleware
            expect(route.route.stack[0].handle).toBe(routeProtection_1.isLoggedIn);
        });
    });
    it("should support report creation with geolocation data through POST endpoint", () => {
        const stack = reportRoutes_1.default.stack;
        const postRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.post);
        // Verify POST route exists and uses correct controller for geolocation reports
        expect(postRoute).toBeDefined();
        expect(postRoute.route.stack[1].handle).toBe(reportController_1.createReport);
    });
    it("should support report listing through GET endpoint", () => {
        const stack = reportRoutes_1.default.stack;
        const getRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/" &&
            layer.route.methods.get);
        // Verify GET route exists and uses correct controller for listing reports
        expect(getRoute).toBeDefined();
        expect(getRoute.route.stack[1].handle).toBe(reportController_1.getReports);
    });
});
