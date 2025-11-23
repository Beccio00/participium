import adminRoutes from "../../../src/routes/adminRoutes";
import { requireAdmin } from "../../../src/middlewares/routeProtection";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  deleteMunicipalityUserController,
  listRolesController,
} from "../../../src/controllers/municipalityController";

jest.mock("../../../src/controllers/municipalityController");

describe("adminRoutes", () => {
  it("should export a router", () => {
    expect(adminRoutes).toBeDefined();
    expect(adminRoutes).toBeInstanceOf(Function);
  });

  it("should apply requireAdmin middleware and expose municipality routes", () => {
    const stack = (adminRoutes as any).stack;
    expect(stack).toBeDefined();
    const middlewareLayer = stack.find((layer: any) => layer.handle === requireAdmin);
    expect(middlewareLayer).toBeDefined();

    const postRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.post
    );
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack[0].handle).toBeInstanceOf(Function);

    const getRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.get
    );
    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack[0].handle).toBeInstanceOf(Function);

    const getById = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.get
    );
    expect(getById).toBeDefined();
    expect(getById.route.stack[0].handle).toBeInstanceOf(Function);

    const deleteRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
    expect(deleteRoute.route.stack[0].handle).toBeInstanceOf(Function);

    const rolesRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/roles" && layer.route.methods.get
    );
    expect(rolesRoute).toBeDefined();
    expect(rolesRoute.route.stack[0].handle).toBeInstanceOf(Function);
  });
});
