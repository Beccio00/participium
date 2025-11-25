import { Request, Response } from "express";

// Mock multer so upload middleware in controller will call the handler and
// populate `req.files` from `req.body.photos` (tests provide photos in body).
jest.mock("multer", () => {
  const mockMulter: any = (opts?: any) => ({
    array: () => (req: any, res: any, cb: any) => {
      req.files =
        req.body && req.body.photos
          ? req.body.photos.map((p: any) => ({
              originalname: p.filename,
              buffer: Buffer.from(""),
              mimetype: "image/jpeg",
              size: 0,
            }))
          : [];
      cb();
    },
  });
  // Provide memoryStorage and a MulterError class so controller instanceof checks work
  mockMulter.memoryStorage = () => ({});
  mockMulter.MulterError = class MulterError extends Error {};
  return mockMulter;
});

// Mock external utilities used by the controller
jest.mock("../../../src/utils/minioClient", () => ({
  __esModule: true,
  default: { putObject: jest.fn().mockResolvedValue(undefined) },
  BUCKET_NAME: "reports-photos",
}));

jest.mock("../../../src/utils/addressFinder", () => ({
  __esModule: true,
  calculateAddress: jest.fn().mockResolvedValue("Some address"),
}));

// Make asyncHandler a no-op wrapper so controller functions are plain async functions
jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

import {
  createReport,
  getReports,
  approveReport,
  rejectReport,
} from "../../../src/controllers/reportController";
import * as reportService from "../../../src/services/reportService";
import { ReportCategory } from "../../../../shared/ReportTypes";

// Mock del service layer
jest.mock("../../../src/services/reportService");
const mockCreateReportService =
  reportService.createReport as jest.MockedFunction<
    typeof reportService.createReport
  >;
const mockGetApprovedReportsService =
  reportService.getApprovedReports as jest.MockedFunction<
    typeof reportService.getApprovedReports
  >;
const mockApproveReportService =
  reportService.approveReport as jest.MockedFunction<
    typeof reportService.approveReport
  >;
const mockRejectReportService =
  reportService.rejectReport as jest.MockedFunction<
    typeof reportService.rejectReport
  >;

describe("reportController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null,
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    // Controller expects latitude/longitude and isAnonymous as strings (parsed internally)
    const validReportData = {
      title: "Broken streetlight",
      description: "The streetlight on Via Roma is not working",
      category: "PUBLIC_LIGHTING" as ReportCategory,
      latitude: "45.0703",
      longitude: "7.6869",
      isAnonymous: "false",
      photos: [
        {
          id: 1,
          url: "https://example.com/photo.jpg",
          filename: "streetlight.jpg",
        },
      ],
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

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.title).toBe(validReportData.title);
      expect(calledWith.description).toBe(validReportData.description);
      expect(calledWith.category).toBe(validReportData.category);
      expect(typeof calledWith.latitude).toBe("number");
      expect(typeof calledWith.longitude).toBe("number");
      expect(typeof calledWith.isAnonymous).toBe("boolean");
      expect(calledWith.userId).toBe(validUser.id);
      expect(Array.isArray(calledWith.photos)).toBe(true);
      expect(calledWith.photos.length).toBe(validReportData.photos.length);
    });

    it("should reject if user is not authenticated", async () => {
      mockReq.body = validReportData;
      mockReq.user = null;

      await expect(
        createReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow();
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    it("should reject if user is undefined", async () => {
      mockReq.body = validReportData;
      mockReq.user = undefined;

      await expect(
        createReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow();
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    it("should pass through missing title to service (no validation in controller)", async () => {
      mockReq.body = { ...validReportData, title: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.title).toBeUndefined();
    });

    it("should pass through missing description to service (no validation in controller)", async () => {
      mockReq.body = { ...validReportData, description: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.description).toBeUndefined();
    });

    it("should pass through missing category to service (no validation in controller)", async () => {
      mockReq.body = { ...validReportData, category: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.category).toBeUndefined();
    });

    it("should parse latitude to NaN when missing and pass to service", async () => {
      mockReq.body = { ...validReportData, latitude: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(Number.isNaN(calledWith.latitude)).toBe(true);
    });

    it("should parse longitude to NaN when missing and pass to service", async () => {
      mockReq.body = { ...validReportData, longitude: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(Number.isNaN(calledWith.longitude)).toBe(true);
    });

    it("should pass through empty photos array when photos are missing", async () => {
      mockReq.body = { ...validReportData, photos: undefined };
      mockReq.user = validUser;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(Array.isArray(calledWith.photos)).toBe(true);
      expect(calledWith.photos.length).toBe(0);
    });

    it("should accept latitude and longitude as 0 (valid coordinates)", async () => {
      mockReq.body = {
        ...validReportData,
        latitude: "0",
        longitude: "0",
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

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.latitude).toBe(0);
      expect(calledWith.longitude).toBe(0);
      expect(calledWith.userId).toBe(validUser.id);
    });

    it("should handle service layer errors", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;

      const serviceError = new Error("Database connection failed");
      mockCreateReportService.mockRejectedValue(serviceError);

      await expect(
        createReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("Database connection failed");
      expect(mockCreateReportService).toHaveBeenCalled();
    });

    it("should create anonymous report", async () => {
      const anonymousReportData = {
        ...validReportData,
        isAnonymous: "true",
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

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.isAnonymous).toBe(true);
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
        "OTHER",
      ];

      for (const category of categories) {
        const reportWithCategory = {
          ...validReportData,
          category,
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

        await createReport(
          mockReq as Request,
          mockRes as Response,
          mockNext as any
        );

        expect(mockCreateReportService).toHaveBeenCalled();
        const calledWith = mockCreateReportService.mock.calls[0][0];
        expect(calledWith.category).toBe(category);
        expect(typeof calledWith.latitude).toBe("number");
        expect(typeof calledWith.longitude).toBe("number");
        expect(typeof calledWith.isAnonymous).toBe("boolean");

        jest.clearAllMocks();
      }
    });

    it("should handle valid Turin coordinates", async () => {
      // Coordinate reali di Torino
      const turinReportData = {
        ...validReportData,
        latitude: 45.0703, // Latitudine di Torino
        longitude: 7.6869, // Longitudine di Torino
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

      await createReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.latitude).toBeCloseTo(45.0703);
      expect(calledWith.longitude).toBeCloseTo(7.6869);
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
            email: "john.doe@example.com",
          },
        },
        {
          id: 2,
          title: "Pothole",
          description: "Large pothole on street",
          category: "ROADS_AND_URBAN_FURNISHINGS",
          latitude: 45.0704,
          longitude: 7.687,
          status: "IN_PROGRESS",
          user: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
          },
        },
      ];

      mockGetApprovedReportsService.mockResolvedValue(mockReports as any);

      await getReports(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockGetApprovedReportsService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReports);
    });

    it("should return empty array when no reports exist", async () => {
      mockGetApprovedReportsService.mockResolvedValue([]);

      await getReports(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockGetApprovedReportsService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should handle service layer errors", async () => {
      const serviceError = new Error("Database query failed");
      mockGetApprovedReportsService.mockRejectedValue(serviceError);

      await expect(
        getReports(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("Database query failed");
      expect(mockGetApprovedReportsService).toHaveBeenCalled();
    });
  });

  describe("approveReport / rejectReport", () => {
    const validUser = { id: 99 };

    it("should approve a report successfully", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = validUser;

      const updatedReport = { id: 10, status: "ASSIGNED" };
      mockApproveReportService.mockResolvedValue(updatedReport as any);

      await approveReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockApproveReportService).toHaveBeenCalledWith(10, validUser.id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Report approved successfully",
        report: updatedReport,
      });
    });

    it("should reject when approve reportId param is invalid", async () => {
      mockReq.params = { reportId: "abc" };
      mockReq.user = validUser;

      await expect(
        approveReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("Invalid report ID parameter");
    });

    it("should propagate service errors on approve", async () => {
      mockReq.params = { reportId: "11" };
      mockReq.user = validUser;
      mockApproveReportService.mockRejectedValue(new Error("DB fail"));

      await expect(
        approveReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("DB fail");
    });

    it("should reject a report successfully with reason", async () => {
      mockReq.params = { reportId: "20" };
      mockReq.user = validUser;
      mockReq.body = { reason: "Not valid content" };

      const updatedReport = {
        id: 20,
        status: "REJECTED",
        rejectionReason: "Not valid content",
      };
      mockRejectReportService.mockResolvedValue(updatedReport as any);

      await rejectReport(
        mockReq as Request,
        mockRes as Response,
        mockNext as any
      );

      expect(mockRejectReportService).toHaveBeenCalledWith(
        20,
        validUser.id,
        "Not valid content"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Report rejected successfully",
        report: updatedReport,
      });
    });

    it("should throw when rejection reason is missing", async () => {
      mockReq.params = { reportId: "21" };
      mockReq.user = validUser;
      mockReq.body = { reason: "" };

      await expect(
        rejectReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("Missing rejection reason");
    });

    it("should throw when reject reportId param is invalid", async () => {
      mockReq.params = { reportId: "xyz" };
      mockReq.user = validUser;
      mockReq.body = { reason: "Some reason" };

      await expect(
        rejectReport(mockReq as Request, mockRes as Response, mockNext as any)
      ).rejects.toThrow("Invalid report ID parameter");
    });
  });
});
