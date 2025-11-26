import adminRoutes from "../../../src/routes/adminRoutes";

jest.mock("../../../src/controllers/municipalityController", () => ({
  createMunicipalityUserController: jest.fn(),
  listMunicipalityUsersController: jest.fn(),
  getMunicipalityUserController: jest.fn(),
  deleteMunicipalityUserController: jest.fn(),
  listRolesController: jest.fn(),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
}));

describe("adminRoutes", () => {
  const stack = (adminRoutes as any).stack;

  it("should export a router", () => {
    expect(adminRoutes).toBeDefined();
  });

  it("should have municipality users routes", () => {
    // POST /municipality-users
    expect(stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.post
    )).toBeDefined();

    // GET /municipality-users
    expect(stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.get
    )).toBeDefined();

    // GET /municipality-users/:userId
    expect(stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.get
    )).toBeDefined();

    // DELETE /municipality-users/:userId
    expect(stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.delete
    )).toBeDefined();
  });

  it("should have roles route", () => {
    // GET /roles
    expect(stack.find(
      (layer: any) => layer.route && layer.route.path === "/roles" && layer.route.methods.get
    )).toBeDefined();
  });
});