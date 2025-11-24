// Mock dei controller e middleware
jest.mock("../../../src/controllers/rootController", () => ({
  getApiInfo: jest.fn(),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

import express from "express";
import rootRoutes from "../../../src/routes/rootRoutes";

describe("Root Routes", () => {
  describe("Router Configuration", () => {
    it("should export an Express router", () => {
      expect(rootRoutes).toBeDefined();
      expect(typeof rootRoutes).toBe("function");
    });

    it("should have routes configured", () => {
      const stack = (rootRoutes as any).stack;
      expect(stack).toBeDefined();
      expect(Array.isArray(stack)).toBe(true);
      expect(stack.length).toBeGreaterThan(0);
    });
  });

  describe("Route Methods", () => {
    it("should support GET method for root", () => {
      const stack = (rootRoutes as any).stack;
      const rootRoute = stack.find(
        (layer: any) => 
          layer.route && 
          layer.route.path === "/" && 
          layer.route.methods.get
      );
      expect(rootRoute).toBeDefined();
    });

    it("should support GET method for health", () => {
      const stack = (rootRoutes as any).stack;
      const healthRoute = stack.find(
        (layer: any) => 
          layer.route && 
          layer.route.path === "/health" && 
          layer.route.methods.get
      );
      expect(healthRoute).toBeDefined();
    });
  });

  describe("Route Integration", () => {
    it("should mount on Express app", () => {
      const app = express();
      app.use("/", rootRoutes);
      expect(app).toBeDefined();
    });
  });
});