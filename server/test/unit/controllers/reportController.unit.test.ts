import { Request, Response } from "express";
import { getReports } from "../../../src/controllers/reportController";
import * as reportService from "../../../src/services/reportService";
import { ReportCategory } from "../../../../shared/ReportTypes";

// Mock del service layer
jest.mock("../../../src/services/reportService");
const mockGetApprovedReportsService = reportService.getApprovedReports as jest.MockedFunction<typeof reportService.getApprovedReports>;

describe("reportController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null,
      query: {},
      files: [],
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET',
      url: '/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getReports", () => {
    it("should return approved reports successfully", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Streetlight issue",
          description: "Broken streetlight",
          category: "PUBLIC_LIGHTING",
          latitude: 45.0703,
          longitude: 7.6869,
          status: "ASSIGNED",
          user: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com"
          }
        },
        {
          id: 2,
          title: "Pothole",
          description: "Large pothole on street",
          category: "ROADS_AND_URBAN_FURNISHINGS",
          latitude: 45.0704,
          longitude: 7.6870,
          status: "IN_PROGRESS",
          user: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com"
          }
        }
      ];

      mockGetApprovedReportsService.mockResolvedValue(mockReports as any);

      await getReports(mockReq as Request, mockRes as Response);

      expect(mockGetApprovedReportsService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReports);
    });

    it("should return empty array when no reports exist", async () => {
      mockGetApprovedReportsService.mockResolvedValue([]);

      await getReports(mockReq as Request, mockRes as Response);

      expect(mockGetApprovedReportsService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should handle service layer errors", async () => {
      const serviceError = new Error("Database query failed");
      mockGetApprovedReportsService.mockRejectedValue(serviceError);

      await expect(getReports(mockReq as Request, mockRes as Response))
        .rejects.toThrow("Database query failed");
    });

    it("should handle invalid category parameter", async () => {
      mockReq.query = { category: "INVALID_CATEGORY" };

      await expect(getReports(mockReq as Request, mockRes as Response))
        .rejects.toThrow("Invalid category");
    });

    it("should filter by category when provided", async () => {
      mockReq.query = { category: "PUBLIC_LIGHTING" };
      const mockReports = [
        {
          id: 1,
          title: "Streetlight issue",
          description: "Broken streetlight",
          category: "PUBLIC_LIGHTING",
          latitude: 45.0703,
          longitude: 7.6869,
          status: "ASSIGNED"
        }
      ];

      mockGetApprovedReportsService.mockResolvedValue(mockReports as any);

      await getReports(mockReq as Request, mockRes as Response);

      expect(mockGetApprovedReportsService).toHaveBeenCalledWith("PUBLIC_LIGHTING");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReports);
    });
  });
});