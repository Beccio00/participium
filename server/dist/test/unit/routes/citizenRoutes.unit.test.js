"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const citizenRoutes_1 = __importDefault(require("../../../src/routes/citizenRoutes"));
// Mock delle dipendenze per evitare errori durante l'import
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
jest.mock("../../../src/interfaces/UserDTO");
describe("citizenRoutes", () => {
    it("should export a router", () => {
        expect(citizenRoutes_1.default).toBeDefined();
        expect(citizenRoutes_1.default).toBeInstanceOf(Function); // express.Router is a function
    });
    it("should have POST route for /signup", () => {
        const stack = citizenRoutes_1.default.stack;
        expect(stack).toBeDefined();
        expect(stack.length).toBeGreaterThan(0);
        // Find the POST route
        const postRoute = stack.find((layer) => layer.route &&
            layer.route.path === "/signup" &&
            layer.route.methods.post);
        expect(postRoute).toBeDefined();
        // The handle should be a function
        expect(typeof postRoute.route.stack[0].handle).toBe("function");
    });
});
