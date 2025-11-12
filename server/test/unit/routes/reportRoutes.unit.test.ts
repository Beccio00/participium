// Mock dei controller e middleware - devono essere prima degli import
jest.mock("../../../src/controllers/reportController", () => ({
  createReport: jest.fn(),
  getReports: jest.fn(),
}));

jest.mock("../../../src/middleware/routeProtection", () => ({
  isLoggedIn: jest.fn(),
}));

import express from "express";
import reportRoutes from "../../../src/routes/reportRoutes";
import { createReport, getReports } from "../../../src/controllers/reportController";
import { isLoggedIn } from "../../../src/middleware/routeProtection";

const mockCreateReport = createReport as jest.MockedFunction<typeof createReport>;
const mockGetReports = getReports as jest.MockedFunction<typeof getReports>;
const mockIsLoggedIn = isLoggedIn as jest.MockedFunction<typeof isLoggedIn>;

describe("reportRoutes", () => {
  it("should export a router", () => {
    expect(reportRoutes).toBeDefined();
    expect(reportRoutes).toBeInstanceOf(Function); // express.Router is a function
  });

  it("should have POST route for /reports with authentication middleware", () => {
    const stack = (reportRoutes as any).stack;
    expect(stack).toBeDefined();
    expect(stack.length).toBeGreaterThan(0);

    // Find the POST route for /
    const postRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.post
    );
    
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack).toHaveLength(2); // middleware + handler
    
    // First should be the isLoggedIn middleware
    expect(postRoute.route.stack[0].handle).toBe(isLoggedIn);
    
    // Second should be the createReport handler
    expect(postRoute.route.stack[1].handle).toBe(createReport);
  });

  it("should have GET route for /reports with authentication middleware", () => {
    const stack = (reportRoutes as any).stack;
    
    // Find the GET route for /
    const getRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.get
    );
    
    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack).toHaveLength(2); // middleware + handler
    
    // First should be the isLoggedIn middleware
    expect(getRoute.route.stack[0].handle).toBe(isLoggedIn);
    
    // Second should be the getReports handler
    expect(getRoute.route.stack[1].handle).toBe(getReports);
  });

  it("should apply isLoggedIn middleware to both routes", () => {
    const stack = (reportRoutes as any).stack;
    
    // Check all routes have the isLoggedIn middleware
    const routes = stack.filter((layer: any) => layer.route);
    
    routes.forEach((route: any) => {
      expect(route.route.stack[0].handle).toBe(isLoggedIn);
    });
  });

  it("should have exactly two routes defined", () => {
    const stack = (reportRoutes as any).stack;
    const routes = stack.filter((layer: any) => layer.route);
    
    expect(routes).toHaveLength(2);
    
    // Verify we have one POST and one GET
    const postRoutes = routes.filter((layer: any) => layer.route.methods.post);
    const getRoutes = routes.filter((layer: any) => layer.route.methods.get);
    
    expect(postRoutes).toHaveLength(1);
    expect(getRoutes).toHaveLength(1);
  });

  it("should use correct path for both routes", () => {
    const stack = (reportRoutes as any).stack;
    const routes = stack.filter((layer: any) => layer.route);
    
    routes.forEach((route: any) => {
      expect(route.route.path).toBe("/");
    });
  });

  it("should have proper middleware order", () => {
    const stack = (reportRoutes as any).stack;
    
    const postRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.post
    );
    
    const getRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.get
    );
    
    // Both routes should have middleware first, then handler
    [postRoute, getRoute].forEach(route => {
      expect(route.route.stack).toHaveLength(2);
      
      // First layer should be middleware (isLoggedIn)
      expect(route.route.stack[0].handle).toBe(isLoggedIn);
      
      // Second layer should be the actual handler
      expect([createReport, getReports]).toContain(route.route.stack[1].handle);
    });
  });

  it("should properly configure authentication requirement for reports creation", () => {
    const stack = (reportRoutes as any).stack;
    
    const postRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.post
    );
    
    // POST route should require authentication (isLoggedIn middleware)
    expect(postRoute.route.stack[0].handle).toBe(isLoggedIn);
    expect(postRoute.route.stack[1].handle).toBe(createReport);
  });

  it("should properly configure authentication requirement for reports retrieval", () => {
    const stack = (reportRoutes as any).stack;
    
    const getRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.get
    );
    
    // GET route should require authentication (isLoggedIn middleware)  
    expect(getRoute.route.stack[0].handle).toBe(isLoggedIn);
    expect(getRoute.route.stack[1].handle).toBe(getReports);
  });

  it("should not have any routes without authentication", () => {
    const stack = (reportRoutes as any).stack;
    const routes = stack.filter((layer: any) => layer.route);
    
    // All routes should have at least 2 handlers (middleware + controller)
    routes.forEach((route: any) => {
      expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
      // First handler should always be authentication middleware
      expect(route.route.stack[0].handle).toBe(isLoggedIn);
    });
  });

  it("should support report creation with geolocation data through POST endpoint", () => {
    const stack = (reportRoutes as any).stack;
    
    const postRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.post
    );
    
    // Verify POST route exists and uses correct controller for geolocation reports
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack[1].handle).toBe(createReport);
  });

  it("should support report listing through GET endpoint", () => {
    const stack = (reportRoutes as any).stack;
    
    const getRoute = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/" &&
        layer.route.methods.get
    );
    
    // Verify GET route exists and uses correct controller for listing reports
    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack[1].handle).toBe(getReports);
  });
});