import adminRoutes from "../../../src/routes/adminRoutes";
import { requireAdmin } from "../../../src/middleware/routeProtection";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  updateMunicipalityUserController,
  deleteMunicipalityUserController,
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
    // requireAdmin should be used as first middleware
    const middlewareLayer = stack.find((layer: any) => layer.handle === requireAdmin);
    expect(middlewareLayer).toBeDefined();

    // check POST /municipality-users
    const postRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.post
    );
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack[0].handle).toBe(createMunicipalityUserController);

    // check GET /municipality-users
    const getRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users" && layer.route.methods.get
    );
    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack[0].handle).toBe(listMunicipalityUsersController);

    // check other routes present
    const getById = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.get
    );
    expect(getById).toBeDefined();
    expect(getById.route.stack[0].handle).toBe(getMunicipalityUserController);

    const putRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.put
    );
    expect(putRoute).toBeDefined();
    expect(putRoute.route.stack[0].handle).toBe(updateMunicipalityUserController);

    const deleteRoute = stack.find(
      (layer: any) => layer.route && layer.route.path === "/municipality-users/:userId" && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
    expect(deleteRoute.route.stack[0].handle).toBe(deleteMunicipalityUserController);
  });
});
