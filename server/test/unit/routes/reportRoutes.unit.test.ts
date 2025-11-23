// Mock dei controller e middleware
jest.mock("../../../src/controllers/reportController", () => ({
  createReport: jest.fn(),
  getReports: jest.fn(),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock("../../../src/middlewares/validateTurinBoundaries", () => ({
  validateTurinBoundaries: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

jest.mock("../../../src/middlewares/uploadsMiddleware", () => ({
  upload: { single: jest.fn(() => (req: any, res: any, next: any) => next()) },
}));

import express from "express";
import reportRoutes from "../../../src/routes/reportRoutes";

describe("Report Routes", () => {
  describe("Router Configuration", () => {
    it("should export an Express router", () => {
      expect(reportRoutes).toBeDefined();
      expect(typeof reportRoutes).toBe("function");
    });

    it("should have routes configured", () => {
      const stack = (reportRoutes as any).stack;
      expect(stack).toBeDefined();
      expect(Array.isArray(stack)).toBe(true);
      expect(stack.length).toBeGreaterThan(0);
    });
  });

  describe("Route Methods", () => {
    it("should support POST method", () => {
      const stack = (reportRoutes as any).stack;
      const postRoute = stack.find(
        (layer: any) => layer.route && layer.route.methods.post
      );
      expect(postRoute).toBeDefined();
    });

    it("should support GET method", () => {
      const stack = (reportRoutes as any).stack;
      const getRoute = stack.find(
        (layer: any) => layer.route && layer.route.methods.get
      );
      expect(getRoute).toBeDefined();
    });
  });

  describe("Route Integration", () => {
    it("should mount on Express app", () => {
      const app = express();
      app.use("/reports", reportRoutes);
      expect(app).toBeDefined();
    });
  });
});