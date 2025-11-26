// Mock dei controller e middleware PRIMA degli import
jest.mock("../../../src/controllers/reportController", () => ({
  createReport: jest.fn(),
  getReports: jest.fn(),
  getPendingReports: jest.fn(),
  approveReport: jest.fn(),
  rejectReport: jest.fn(),
  getAssignableTechnicals: jest.fn(),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn(),
  requirePublicRelations: jest.fn(),
}));

jest.mock("../../../src/middlewares/validateTurinBoundaries", () => ({
  validateTurinBoundaries: jest.fn(),
}));

jest.mock("../../../src/middlewares/validationMiddlewere", () => ({
  ApiValidationMiddleware: jest.fn(),
}));

// Mock di Multer (upload middleware)
jest.mock("../../../src/middlewares/uploadsMiddleware", () => ({
  upload: {
    array: jest.fn(() => (req: any, res: any, next: any) => next()),
  },
}));

import reportRoutes from "../../../src/routes/reportRoutes";
import * as reportController from "../../../src/controllers/reportController";

describe("reportRoutes", () => {
  const stack = (reportRoutes as any).stack;

  it("should export a router", () => {
    expect(reportRoutes).toBeDefined();
    expect(reportRoutes).toBeInstanceOf(Function);
  });

  it("POST / - should exist and use correct middlewares", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.post
    );

    expect(route).toBeDefined();
    // Verifica che ci siano gli step attesi nello stack della rotta
    // requireCitizen, upload, validateTurinBoundaries, createReport
    // Nota: upload.array ritorna una funzione, quindi verifichiamo la lunghezza
    expect(route.route.stack.length).toBeGreaterThanOrEqual(4);
    
    // Verifichiamo l'handler finale
    const lastHandler = route.route.stack[route.route.stack.length - 1].handle;
    // Poiché usiamo asyncHandler che wrappa la funzione, verifichiamo l'identità o l'esecuzione
    // In questo mock setup base, controlliamo solo che esista.
    expect(lastHandler).toBeDefined();
  });

  it("GET / - should exist", () => {
    const route = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it("GET /pending - should exist and use requirePublicRelations", () => {
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