// Mock controllers and middleware BEFORE imports
jest.mock("../../../src/controllers/reportController", () => ({
  createReport: jest.fn((req: any, res: any) => res.status(201).json({})),
  getReports: jest.fn((req: any, res: any) => res.json([])),
  getReportById: jest.fn((req: any, res: any) => res.json({})),
  getPendingReports: jest.fn((req: any, res: any) => res.json([])),
  getAssignedReports: jest.fn((req: any, res: any) => res.json([])),
  approveReport: jest.fn((req: any, res: any) => res.json({})),
  rejectReport: jest.fn((req: any, res: any) => res.json({})),
  updateReportStatus: jest.fn((req: any, res: any) => res.json({})),
  getAssignableTechnicals: jest.fn((req: any, res: any) => res.json([])),
  createInternalNote: jest.fn((req: any, res: any) => res.json({})),
  getInternalNote: jest.fn((req: any, res: any) => res.json({})),
}));

jest.mock("../../../src/controllers/messageController", () => ({
  sendMessageToCitizen: jest.fn((req: any, res: any) => res.json({})),
  getReportMessages: jest.fn((req: any, res: any) => res.json([])),
}));

jest.mock("../../../src/controllers/externalController", () => ({
  getAssignableExternals: jest.fn((req: any, res: any) => res.json([])),
  assignReportToExternal: jest.fn((req: any, res: any) => res.json({})),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn((req: any, res: any, next: any) => next()),
  requirePublicRelations: jest.fn((req: any, res: any, next: any) => next()),
  requireTechnicalStaff: jest.fn((req: any, res: any, next: any) => next()),
  requireTechnicalStaffOnly: jest.fn((req: any, res: any, next: any) => next()),
  requireTechnicalOrExternal: jest.fn((req: any, res: any, next: any) => next()),
  isLoggedIn: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock("../../../src/middlewares/validateTurinBoundaries", () => ({
  validateTurinBoundaries: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock("../../../src/middlewares/validationMiddlewere", () => ({
  ApiValidationMiddleware: [(req: any, res: any, next: any) => next()],
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

// Mock di Multer (upload middleware)
jest.mock("../../../src/middlewares/uploadsMiddleware", () => ({
  upload: {
    array: jest.fn(() => (req: any, res: any, next: any) => next()),
  },
}));

import reportRoutes from "../../../src/routes/reportRoutes";

describe("reportRoutes", () => {
  const stack = (reportRoutes as any).stack;

  it("should export a router", () => {
    expect(reportRoutes).toBeDefined();
    expect(typeof reportRoutes).toBe("function");
  });

  it("POST / - should exist for creating reports", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.post
    );

    expect(route).toBeDefined();
  });

  it("GET / - should exist for listing reports", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it("GET /pending - should exist for pending reports", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/pending" && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it("POST /:reportId/approve - should exist", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/:reportId/approve" &&
        layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it("POST /:reportId/reject - should exist", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/:reportId/reject" &&
        layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it("GET /:reportId/assignable-technicals - should exist", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/:reportId/assignable-technicals" &&
        layer.route.methods.get
    );
    expect(route).toBeDefined();
  });
});
