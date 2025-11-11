import express from "express";
import citizenRoutes from "../../../src/routes/citizenRoutes";

// Mock delle dipendenze per evitare errori durante l'import
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");
jest.mock("../../../src/interfaces/UserDTO");

describe("citizenRoutes", () => {
  it("should export a router", () => {
    expect(citizenRoutes).toBeDefined();
    expect(citizenRoutes).toBeInstanceOf(Function); // express.Router is a function
  });

  it("should have POST route for /signup", () => {
    const stack = (citizenRoutes as any).stack;
    expect(stack).toBeDefined();
    expect(stack.length).toBeGreaterThan(0);

    // Find the POST route
    const postRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/signup" &&
        layer.route.methods.post
    );
    expect(postRoute).toBeDefined();
    // The handle should be a function
    expect(typeof postRoute.route.stack[0].handle).toBe("function");
  });
});
