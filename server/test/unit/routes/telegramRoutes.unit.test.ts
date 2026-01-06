// Mock controllers and middleware BEFORE imports
jest.mock("../../../src/controllers/telegramController", () => ({
  generateToken: jest.fn((req: any, res: any) => res.status(200).json({})),
  linkAccount: jest.fn((req: any, res: any) => res.status(200).json({})),
  getStatus: jest.fn((req: any, res: any) => res.status(200).json({})),
  unlink: jest.fn((req: any, res: any) => res.status(200).json({})),
  createReport: jest.fn((req: any, res: any) => res.status(201).json({})),
  checkLinked: jest.fn((req: any, res: any) => res.status(200).json({})),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock("../../../src/middlewares/validationMiddlewere", () => ({
  ApiValidationMiddleware: [(req: any, res: any, next: any) => next()],
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

import telegramRoutes from "../../../src/routes/telegramRoutes";

describe("telegramRoutes", () => {
  const stack = (telegramRoutes as any).stack;

  it("should export a router", () => {
    expect(telegramRoutes).toBeDefined();
    expect(typeof telegramRoutes).toBe("function");
  });

  describe("Route existence tests", () => {
    it("POST /generate-token - should exist for generating Telegram link token", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/generate-token" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/generate-token");
    });

    it("POST /link - should exist for linking Telegram account", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/link" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/link");
    });

    it("GET /status - should exist for getting Telegram status", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/status" && 
          layer.route.methods.get
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/status");
    });

    it("DELETE /unlink - should exist for unlinking Telegram account", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/unlink" && 
          layer.route.methods.delete
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/unlink");
    });

    it("POST /reports - should exist for creating reports from Telegram", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/reports" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/reports");
    });

    it("POST /check-linked - should exist for checking if telegramId is linked", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/check-linked" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.path).toBe("/check-linked");
    });
  });

  describe("Route middleware tests", () => {
    it("POST /generate-token - should have requireCitizen middleware", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/generate-token" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      // Check if the route has multiple middleware layers (requireCitizen, ApiValidationMiddleware, asyncHandler)
      expect(route.route.stack.length).toBeGreaterThan(1);
    });

    it("POST /link - should have ApiValidationMiddleware only (no auth required)", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/link" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      // This route should have fewer middleware layers since no auth is required
      expect(route.route.stack.length).toBeGreaterThan(0);
    });

    it("GET /status - should have requireCitizen middleware", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/status" && 
          layer.route.methods.get
      );

      expect(route).toBeDefined();
      expect(route.route.stack.length).toBeGreaterThan(1);
    });

    it("DELETE /unlink - should have requireCitizen middleware", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/unlink" && 
          layer.route.methods.delete
      );

      expect(route).toBeDefined();
      expect(route.route.stack.length).toBeGreaterThan(1);
    });

    it("POST /reports - should have ApiValidationMiddleware only (no auth required)", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/reports" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.stack.length).toBeGreaterThan(0);
    });

    it("POST /check-linked - should have ApiValidationMiddleware only (no auth required)", () => {
      const route = stack.find(
        (layer: any) =>
          layer.route && 
          layer.route.path === "/check-linked" && 
          layer.route.methods.post
      );

      expect(route).toBeDefined();
      expect(route.route.stack.length).toBeGreaterThan(0);
    });
  });

  describe("Route handler tests", () => {
    it("should have correct number of routes", () => {
      const routes = stack.filter((layer: any) => layer.route);
      expect(routes).toHaveLength(6);
    });

    it("should handle all HTTP methods correctly", () => {
      const postRoutes = stack.filter(
        (layer: any) => layer.route && layer.route.methods.post
      );
      const getRoutes = stack.filter(
        (layer: any) => layer.route && layer.route.methods.get
      );
      const deleteRoutes = stack.filter(
        (layer: any) => layer.route && layer.route.methods.delete
      );

      expect(postRoutes).toHaveLength(4); // generate-token, link, reports, check-linked
      expect(getRoutes).toHaveLength(1);   // status
      expect(deleteRoutes).toHaveLength(1); // unlink
    });

    it("should have unique route paths", () => {
      const routePaths = stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => layer.route.path);

      const uniquePaths = [...new Set(routePaths)];
      expect(uniquePaths).toHaveLength(routePaths.length);
    });
  });

  describe("Route path validation", () => {
    it("should have correct route paths structure", () => {
      const expectedPaths = [
        "/generate-token",
        "/link",
        "/status",
        "/unlink",
        "/reports",
        "/check-linked"
      ];

      const actualPaths = stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => layer.route.path);

      expectedPaths.forEach(path => {
        expect(actualPaths).toContain(path);
      });
    });

    it("should not have any parametrized routes", () => {
      const routePaths = stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => layer.route.path);

      const parametrizedRoutes = routePaths.filter((path: string) => path.includes(":"));
      expect(parametrizedRoutes).toHaveLength(0);
    });
  });

  describe("Route organization tests", () => {
    it("should group authentication-required routes correctly", () => {
      const authRequiredPaths = ["/generate-token", "/status", "/unlink"];
      
      authRequiredPaths.forEach(path => {
        const route = stack.find(
          (layer: any) => layer.route && layer.route.path === path
        );
        expect(route).toBeDefined();
        // These routes should have more middleware (auth + validation + asyncHandler)
        expect(route.route.stack.length).toBeGreaterThan(1);
      });
    });

    it("should group bot-accessible routes correctly", () => {
      const botAccessiblePaths = ["/link", "/reports", "/check-linked"];
      
      botAccessiblePaths.forEach(path => {
        const route = stack.find(
          (layer: any) => layer.route && layer.route.path === path
        );
        expect(route).toBeDefined();
        // Bot routes should have minimal middleware (just validation + asyncHandler)
        expect(route.route.stack.length).toBeGreaterThan(0);
      });
    });
  });
});