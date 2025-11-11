import express from "express";
import authRoutes from "../../../src/routes/authRoutes";
import {
  login,
  logout,
  getSessionInfo,
} from "../../../src/controllers/authController";

// Mock dei controller
jest.mock("../../../src/controllers/authController");
const mockLogin = login as jest.MockedFunction<typeof login>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockGetSessionInfo = getSessionInfo as jest.MockedFunction<
  typeof getSessionInfo
>;

describe("authRoutes", () => {
  it("should export a router", () => {
    expect(authRoutes).toBeDefined();
    expect(authRoutes).toBeInstanceOf(Function); // express.Router is a function
  });

  it("should have POST route for /", () => {
    // Since routes are registered, we can check if the router has the routes
    // But express.Router().stack contains the layers
    const stack = (authRoutes as any).stack;
    expect(stack).toBeDefined();
    expect(stack.length).toBeGreaterThan(0);

    // Find the POST route
    const postRoute = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.post
    );
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack[0].handle).toBe(login);
  });

  it("should have DELETE route for /current", () => {
    const stack = (authRoutes as any).stack;
    const deleteRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/current" &&
        layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
    expect(deleteRoute.route.stack[0].handle).toBe(logout);
  });

  it("should have GET route for /current", () => {
    const stack = (authRoutes as any).stack;
    const getRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/current" &&
        layer.route.methods.get
    );
    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack[0].handle).toBe(getSessionInfo);
  });
});
