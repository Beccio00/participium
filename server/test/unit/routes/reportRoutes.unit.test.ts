// Mock dei controller e middleware
jest.mock("../../../src/controllers/reportController", () => ({
  createReport: jest.fn(),
  getReports: jest.fn(),
  getPendingReports: jest.fn(),
  approveReport: jest.fn(),
  rejectReport: jest.fn(),
}));

jest.mock("../../../src/middlewares/routeProtection", () => ({
  requireCitizen: jest.fn(),
  requirePublicRelations: jest.fn(),
}));

jest.mock("../../../src/middlewares/validateTurinBoundaries", () => ({
  validateTurinBoundaries: jest.fn(),
}));

import express from "express";
import reportRoutes from "../../../src/routes/reportRoutes";
import {
  createReport,
  getReports,
} from "../../../src/controllers/reportController";
import { requireCitizen } from "../../../src/middlewares/routeProtection";
import { validateTurinBoundaries } from "../../../src/middlewares/validateTurinBoundaries";

describe("reportRoutes", () => {
  it("should export a router", () => {
    expect(reportRoutes).toBeDefined();
    expect(reportRoutes).toBeInstanceOf(Function); // express.Router is a function
  });

  it("should have POST route for / with requireCitizen and validateTurinBoundaries middleware", () => {
    const stack = (reportRoutes as any).stack;

    const postRoute = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.post
    );

    expect(postRoute).toBeDefined();
    // expect middleware: requireCitizen, validateTurinBoundaries, handler: createReport
    expect(postRoute.route.stack).toHaveLength(3);
    expect(postRoute.route.stack[0].handle).toBe(requireCitizen);
    expect(postRoute.route.stack[1].handle).toBe(validateTurinBoundaries);
    expect(postRoute.route.stack[2].handle).toBe(createReport);
  });

  it("should have GET route for / that uses getReports handler", () => {
    const stack = (reportRoutes as any).stack;

    const getRoute = stack.find(
      (layer: any) =>
        layer.route && layer.route.path === "/" && layer.route.methods.get
    );

    expect(getRoute).toBeDefined();
    expect(getRoute.route.stack).toHaveLength(1);
    expect(getRoute.route.stack[0].handle).toBe(getReports);
  });
});
