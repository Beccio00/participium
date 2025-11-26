import authRoutes from "../../../src/routes/authRoutes";

// Mock controller
jest.mock("../../../src/controllers/authController", () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getSessionInfo: jest.fn(),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn) => fn),
}));

describe("authRoutes", () => {
  const stack = (authRoutes as any).stack;

  it("should export a router", () => {
    expect(authRoutes).toBeDefined();
  });

  it("POST / - should exist (login)", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it("DELETE /current - should exist (logout)", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/current" && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });

  it("GET /current - should exist (session info)", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/current" && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });
});