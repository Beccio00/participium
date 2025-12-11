import request from "supertest";
import express, { Express } from "express";
import reportRoutes from "../../../src/routes/reportRoutes";

// Mock all dependencies
jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireTechnicalOrExternal: (req: any, res: any, next: any) => next(),
  isLoggedIn: (req: any, res: any, next: any) => next(),
  requireCitizen: (req: any, res: any, next: any) => next(),
  requirePublicRelations: (req: any, res: any, next: any) => next(),
  requireTechnicalStaffOnly: (req: any, res: any, next: any) => next(),
  requireCitizenAuthorOrTechnicalOrExternal: (req: any, res: any, next: any) =>
    next(),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

jest.mock("../../../src/middlewares/validationMiddlewere", () => ({
  ApiValidationMiddleware: (req: any, res: any, next: any) => next(),
}));

jest.mock("../../../src/middlewares/validateTurinBoundaries", () => ({
  validateTurinBoundaries: (req: any, res: any, next: any) => next(),
}));

jest.mock("../../../src/middlewares/uploadsMiddleware", () => ({
  upload: {
    array: () => (req: any, res: any, next: any) => next(),
  },
}));

jest.mock("../../../src/controllers/reportController", () => ({
  createReport: (req: any, res: any) => res.status(201).json({ id: 1 }),
  getReports: (req: any, res: any) => res.status(200).json([]),
  getReportById: (req: any, res: any) => res.status(200).json({ id: 1 }),
  getPendingReports: (req: any, res: any) => res.status(200).json([]),
  approveReport: (req: any, res: any) =>
    res.status(200).json({ success: true }),
  rejectReport: (req: any, res: any) => res.status(200).json({ success: true }),
  getAssignableTechnicals: (req: any, res: any) => res.status(200).json([]),
  updateReportStatus: (req: any, res: any) =>
    res.status(200).json({ success: true }),
  getAssignedReports: (req: any, res: any) => res.status(200).json([]),
  createInternalNote: (req: any, res: any) => res.status(201).json({ id: 1 }),
  getInternalNote: (req: any, res: any) => res.status(200).json([]),
}));

jest.mock("../../../src/controllers/messageController", () => ({
  sendMessageToCitizen: (req: any, res: any) =>
    res.status(201).json({ success: true }),
  getReportMessages: (req: any, res: any) => res.status(200).json([]),
}));

jest.mock("../../../src/controllers/externalController", () => ({
  getAssignableExternals: (req: any, res: any) => res.status(200).json([]),
  assignReportToExternal: (req: any, res: any) =>
    res.status(200).json({ success: true }),
}));

/**
 * Report Routes - Internal Notes (PT26) - Unit Tests
 *
 * These tests verify the route structure and HTTP method validation for internal notes endpoints.
 * Functional behavior is covered by controller, service, and repository tests.
 */
describe("Report Routes - Internal Notes (PT26)", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/reports", reportRoutes);
  });

  describe("Route structure validation", () => {
    it("should return 404 for non-existent routes", async () => {
      await request(app).get("/api/reports/1/non-existent").expect(404);
    });

    it("should not accept PUT requests for internal notes", async () => {
      const response = await request(app)
        .put("/api/reports/1/internal-notes")
        .send({ content: "Test" });

      expect(response.status).not.toBe(200);
      expect(response.status).not.toBe(201);
    });

    it("should not accept DELETE requests for internal notes", async () => {
      const response = await request(app).delete(
        "/api/reports/1/internal-notes"
      );

      expect(response.status).not.toBe(200);
      expect(response.status).not.toBe(204);
    });

    it("should not accept PATCH requests for internal notes", async () => {
      const response = await request(app)
        .patch("/api/reports/1/internal-notes")
        .send({ content: "Test" });

      expect(response.status).not.toBe(200);
    });
  });
});
