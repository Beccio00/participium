import { Request, Response } from "express";
import { createReport, getReports } from "../../../src/controllers/reportController";
import * as reportService from "../../../src/services/reportService";
import { ReportCategory } from "../../../../shared/ReportTypes";

// Mock del service layer
jest.mock("../../../src/services/reportService");
const mockCreateReportService = reportService.createReport as jest.MockedFunction<typeof reportService.createReport>;
const mockGetApprovedReportsService = reportService.getApprovedReports as jest.MockedFunction<typeof reportService.getApprovedReports>;

describe("reportController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    const validReportData = {
      title: "Broken streetlight",
      description: "The streetlight on Via Roma is not working",
      category: "PUBLIC_LIGHTING" as ReportCategory,
      latitude: 45.0703,
      longitude: 7.6869,
      isAnonymous: false,
      photos: [
        {
          id: 1,
          url: "https://example.com/photo.jpg",
          filename: "streetlight.jpg"
        }
      ]
    };

    const validUser = {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "CITIZEN" as const,
      telegramUsername: null,
      emailNotificationsEnabled: true,
    };

    it("should create report successfully with valid data", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      
      const mockCreatedReport = {
        id: 1,
        ...validReportData,
        userId: validUser.id,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalledWith({
        title: validReportData.title,
        description: validReportData.description,
        category: validReportData.category,
        latitude: validReportData.latitude,
        longitude: validReportData.longitude,
        isAnonymous: validReportData.isAnonymous,
        photos: validReportData.photos,
        userId: validUser.id,
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Report created successfully",
        id: mockCreatedReport.id,
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq.body = validReportData;
      mockReq.user = null;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "User not logged in",
      });
    });

    it("should return 401 if user is undefined", async () => {
      mockReq.body = validReportData;
      mockReq.user = undefined;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "User not logged in",
      });
    });

    it("should return 400 if title is missing", async () => {
      mockReq.body = { ...validReportData, title: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should return 400 if description is missing", async () => {
      mockReq.body = { ...validReportData, description: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should return 400 if category is missing", async () => {
      mockReq.body = { ...validReportData, category: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should return 400 if latitude is missing", async () => {
      mockReq.body = { ...validReportData, latitude: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should return 400 if longitude is missing", async () => {
      mockReq.body = { ...validReportData, longitude: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should return 400 if photos are missing", async () => {
      mockReq.body = { ...validReportData, photos: undefined };
      mockReq.user = validUser;

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing required fields",
      });
    });

    it("should accept latitude and longitude as 0 (valid coordinates)", async () => {
      mockReq.body = { 
        ...validReportData, 
        latitude: 0, 
        longitude: 0 
      };
      mockReq.user = validUser;

      const mockCreatedReport = {
        id: 1,
        ...mockReq.body,
        userId: validUser.id,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalledWith({
        title: validReportData.title,
        description: validReportData.description,
        category: validReportData.category,
        latitude: 0,
        longitude: 0,
        isAnonymous: validReportData.isAnonymous,
        photos: validReportData.photos,
        userId: validUser.id,
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle service layer errors", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;

      const serviceError = new Error("Database connection failed");
      mockCreateReportService.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await createReport(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith("Error creating report", serviceError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Unable to create report",
      });

      consoleSpy.mockRestore();
    });

    it("should create anonymous report", async () => {
      const anonymousReportData = {
        ...validReportData,
        isAnonymous: true
      };
      
      mockReq.body = anonymousReportData;
      mockReq.user = validUser;

      const mockCreatedReport = {
        id: 1,
        ...anonymousReportData,
        userId: validUser.id,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalledWith({
        title: anonymousReportData.title,
        description: anonymousReportData.description,
        category: anonymousReportData.category,
        latitude: anonymousReportData.latitude,
        longitude: anonymousReportData.longitude,
        isAnonymous: true,
        photos: anonymousReportData.photos,
        userId: validUser.id,
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle different report categories", async () => {
      const categories = [
        "WATER_SUPPLY_DRINKING_WATER",
        "ARCHITECTURAL_BARRIERS", 
        "SEWER_SYSTEM",
        "PUBLIC_LIGHTING",
        "WASTE",
        "ROAD_SIGNS_TRAFFIC_LIGHTS",
        "ROADS_URBAN_FURNISHINGS",
        "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
        "OTHER"
      ];

      for (const category of categories) {
        const reportWithCategory = {
          ...validReportData,
          category
        };

        mockReq.body = reportWithCategory;
        mockReq.user = validUser;

        const mockCreatedReport = {
          id: 1,
          ...reportWithCategory,
          userId: validUser.id,
          status: "PENDING_APPROVAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith({
          title: reportWithCategory.title,
          description: reportWithCategory.description,
          category: category,
          latitude: reportWithCategory.latitude,
          longitude: reportWithCategory.longitude,
          isAnonymous: reportWithCategory.isAnonymous,
          photos: reportWithCategory.photos,
          userId: validUser.id,
        });

        jest.clearAllMocks();
      }
    });

    it("should handle valid Turin coordinates", async () => {
      // Coordinate reali di Torino
      const turinReportData = {
        ...validReportData,
        latitude: 45.0703, // Latitudine di Torino
        longitude: 7.6869  // Longitudine di Torino
      };

      mockReq.body = turinReportData;
      mockReq.user = validUser;

      const mockCreatedReport = {
        id: 1,
        ...turinReportData,
        userId: validUser.id,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalledWith({
        title: turinReportData.title,
        description: turinReportData.description,
        category: turinReportData.category,
        latitude: 45.0703,
        longitude: 7.6869,
        isAnonymous: turinReportData.isAnonymous,
        photos: turinReportData.photos,
        userId: validUser.id,
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
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

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getReports(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith("Error during report retrieval:", serviceError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "InternalServerError",
        message: "Error during report retrieval",
      });

      consoleSpy.mockRestore();
    });
  });
});