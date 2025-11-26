import express, { Request, Response } from "express";
import rootRoutes from "../../../src/routes/rootRoutes";
import * as rootController from "../../../src/controllers/rootController";

// Mock del controller
jest.mock("../../../src/controllers/rootController", () => ({
  getApiInfo: jest.fn(),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

describe("Root Routes", () => {
  describe("Router Configuration", () => {
    it("should export an Express router", () => {
      expect(rootRoutes).toBeDefined();
      expect(typeof rootRoutes).toBe("function");
    });
  });

  describe("Route Definitions", () => {
    const stack = (rootRoutes as any).stack;

    it("should have GET / route using getApiInfo", () => {
      const rootRoute = stack.find(
        (layer: any) =>
          layer.route && layer.route.path === "/" && layer.route.methods.get
      );
      expect(rootRoute).toBeDefined();
      expect(rootRoute.route.stack[0].handle).toBe(rootController.getApiInfo);
    });

    it("should have GET /health route with inline handler", () => {
      const healthRoute = stack.find(
        (layer: any) =>
          layer.route &&
          layer.route.path === "/health" &&
          layer.route.methods.get
      );
      expect(healthRoute).toBeDefined();
      
      // TEST CRUCIALE PER IL 100% COVERAGE:
      // Estraiamo l'handler inline ed eseguiamolo simulando req/res
      const handler = healthRoute.route.stack[0].handle;
      
      const mockReq = {} as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Eseguiamo la funzione
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ok",
          timestamp: expect.any(String),
        })
      );
    });
  });
});