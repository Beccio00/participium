// Mock dependencies
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
jest.mock("../../../src/interfaces/UserDTO");

jest.mock("../../../src/controllers/citizenController", () => ({
  signup: jest.fn(() => (req: any, res: any) => {}),
  getCitizenProfile: jest.fn(),
  updateCitizenProfile: jest.fn(),
  uploadCitizenPhoto: jest.fn(),
  deleteCitizenPhoto: jest.fn(),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn((req, res, next) => next()),
}));

jest.mock("../../../src/middlewares/validationMiddlewere", () => ({
  ApiValidationMiddleware: jest.fn((req, res, next) => next()),
}));

// Mock Multer
jest.mock("../../../src/middlewares/uploadsMiddleware", () => ({
  upload: {
    array: jest.fn(() => (req: any, res: any, next: any) => next()),
  },
}));

import citizenRoutes from "../../../src/routes/citizenRoutes";

describe("citizenRoutes", () => {
  const stack = (citizenRoutes as any).stack;

  it("should export a router", () => {
    expect(citizenRoutes).toBeDefined();
  });

  it("POST /signup - should be configured", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/signup" && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it("POST /me/photo - should be configured", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/me/photo" && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it("GET /me - should be configured", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/me" && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it("PATCH /me - should be configured", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/me" && layer.route.methods.patch
    );
    expect(route).toBeDefined();
  });

  it("DELETE /me/photo - should be configured", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/me/photo" && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });
});