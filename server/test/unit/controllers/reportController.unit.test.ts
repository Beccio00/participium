import { Request, Response } from "express";

// Mock multer e utility
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
  mockMulter.memoryStorage = () => ({});
  mockMulter.MulterError = class MulterError extends Error {};
  return mockMulter;
});

jest.mock("../../../src/utils/minioClient", () => ({
  __esModule: true,
  default: { putObject: jest.fn().mockResolvedValue(undefined) },
  getMinioObjectUrl: jest.fn((filename) => `http://minio/bucket/${filename}`),
  BUCKET_NAME: "reports-photos",
}));

jest.mock("../../../src/utils/addressFinder", () => ({
  __esModule: true,
  calculateAddress: jest.fn().mockResolvedValue("Some address"),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

import {
  createReport,
  getReports,
  approveReport,
  rejectReport,
  getAssignableTechnicals,
  getPendingReports,
} from "../../../src/controllers/reportController";
import * as reportService from "../../../src/services/reportService";
import { ReportCategory } from "../../../../shared/ReportTypes";
import { BadRequestError } from "../../../src/utils";

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
const mockGetPendingReportsService =
  reportService.getPendingReports as jest.MockedFunction<
    typeof reportService.getPendingReports
  >;
const mockGetAssignableTechnicalsService =
  reportService.getAssignableTechnicalsForReport as jest.MockedFunction<
    typeof reportService.getAssignableTechnicalsForReport
  >;

describe("reportController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null,
      query: {},
      files: [],
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

    const mockFiles = [
      {
        originalname: "streetlight.jpg",
        buffer: Buffer.from("fake-image"),
        mimetype: "image/jpeg",
        size: 1024,
      },
    ];

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
      mockReq.files = mockFiles;

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

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.title).toBe(validReportData.title);
      expect(calledWith.userId).toBe(validUser.id);
      expect(calledWith.photos.length).toBe(1);
    });

    it("should reject if user is not authenticated", async () => {
      mockReq.body = validReportData;
      mockReq.files = mockFiles;
      mockReq.user = null;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    it("should reject if user is undefined", async () => {
      mockReq.body = validReportData;
      mockReq.files = mockFiles;
      mockReq.user = undefined;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    // --- Validation Tests ---

    it("should throw BadRequestError if title is missing", async () => {
      mockReq.body = { ...validReportData, title: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(createReport(mockReq as Request, mockRes as Response)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if description is missing", async () => {
      mockReq.body = { ...validReportData, description: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(createReport(mockReq as Request, mockRes as Response)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if category is missing", async () => {
      mockReq.body = { ...validReportData, category: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(createReport(mockReq as Request, mockRes as Response)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if latitude is missing", async () => {
      mockReq.body = { ...validReportData, latitude: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(createReport(mockReq as Request, mockRes as Response)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if longitude is missing", async () => {
      mockReq.body = { ...validReportData, longitude: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(createReport(mockReq as Request, mockRes as Response)).rejects.toThrow(BadRequestError);
    });

    // --- Coverage Tests (New) ---

    it("should throw BadRequestError if more than 3 photos are uploaded", async () => {
      mockReq.body = { ...validReportData };
      mockReq.user = validUser;
      // Array with 4 files
      mockReq.files = [mockFiles[0], mockFiles[0], mockFiles[0], mockFiles[0]]; 

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Maximum 3 photos allowed");
      
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError if category is invalid", async () => {
      mockReq.body = { ...validReportData, category: "INVALID_CATEGORY" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid category");
      
      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError if latitude is not a number", async () => {
      mockReq.body = { ...validReportData, latitude: "not-a-number" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid coordinates");
    });

    it("should throw BadRequestError if longitude is not a number", async () => {
      mockReq.body = { ...validReportData, longitude: "invalid" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid coordinates");
    });

    it("should throw BadRequestError if latitude is out of range (< -90)", async () => {
      mockReq.body = { ...validReportData, latitude: "-91" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid latitude");
    });

    it("should throw BadRequestError if latitude is out of range (> 90)", async () => {
      mockReq.body = { ...validReportData, latitude: "91" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid latitude");
    });

    it("should throw BadRequestError if longitude is out of range (< -180)", async () => {
      mockReq.body = { ...validReportData, longitude: "-181" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid longitude");
    });

    it("should throw BadRequestError if longitude is out of range (> 180)", async () => {
      mockReq.body = { ...validReportData, longitude: "181" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid longitude");
    });

    it("should throw BadRequestError when photos array is empty", async () => {
      mockReq.body = { ...validReportData };
      mockReq.user = validUser;
      mockReq.files = [];

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("At least one photo is required");

      expect(mockCreateReportService).not.toHaveBeenCalled();
    });

    // --- End Coverage Tests ---

    it("should accept latitude and longitude as 0 (valid coordinates)", async () => {
      mockReq.body = {
        ...validReportData,
        latitude: "0",
        longitude: "0",
      };
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      const mockCreatedReport = {
        id: 1,
        ...mockReq.body,
        userId: validUser.id,
        status: "PENDING_APPROVAL",
      };

      mockCreateReportService.mockResolvedValue(mockCreatedReport as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.latitude).toBe(0);
      expect(calledWith.longitude).toBe(0);
    });

    it("should handle service layer errors", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      const serviceError = new Error("Database connection failed");
      mockCreateReportService.mockRejectedValue(serviceError);

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Database connection failed");
    });

    it("should create anonymous report", async () => {
      const anonymousReportData = {
        ...validReportData,
        isAnonymous: "true",
      };

      mockReq.body = anonymousReportData;
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalled();
      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.isAnonymous).toBe(true);
    });

    it("should handle different report categories", async () => {
      const categories = Object.values(ReportCategory);

      for (const category of categories) {
        mockReq.body = { ...validReportData, category };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const calledWith = mockCreateReportService.mock.calls[0][0];
        expect(calledWith.category).toBe(category);
        jest.clearAllMocks();
      }
    });

    it("should handle valid Turin coordinates", async () => {
      const turinReportData = {
        ...validReportData,
        latitude: 45.0703,
        longitude: 7.6869,
      };

      mockReq.body = turinReportData;
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      mockCreateReportService.mockResolvedValue({ id: 1 } as any);

      await createReport(mockReq as Request, mockRes as Response);

      const calledWith = mockCreateReportService.mock.calls[0][0];
      expect(calledWith.latitude).toBeCloseTo(45.0703);
    });
  });

  describe("getReports", () => {
    it("should return approved reports successfully", async () => {
      const mockReports = [{ id: 1, title: "Streetlight issue", status: "ASSIGNED" }];

      mockGetApprovedReportsService.mockResolvedValue(mockReports as any);

      await getReports(mockReq as Request, mockRes as Response);

      expect(mockGetApprovedReportsService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReports);
    });

    it("should return empty array when no reports exist", async () => {
      mockGetApprovedReportsService.mockResolvedValue([]);
      await getReports(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should filter by category when provided", async () => {
        mockReq.query = { category: "PUBLIC_LIGHTING" };
        mockGetApprovedReportsService.mockResolvedValue([]);
        
        await getReports(mockReq as Request, mockRes as Response);
        
        expect(mockGetApprovedReportsService).toHaveBeenCalledWith("PUBLIC_LIGHTING");
    });

    it("should throw BadRequestError when invalid category is provided", async () => {
        mockReq.query = { category: "INVALID_CAT" };
        
        await expect(
            getReports(mockReq as Request, mockRes as Response)
        ).rejects.toThrow(BadRequestError);
        
        expect(mockGetApprovedReportsService).not.toHaveBeenCalled();
    });

    it("should handle service layer errors", async () => {
      const serviceError = new Error("Database query failed");
      mockGetApprovedReportsService.mockRejectedValue(serviceError);
      await expect(
        getReports(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Database query failed");
    });
  });

  describe("approveReport / rejectReport", () => {
    const validUser = { id: 99 };

    it("should approve a report successfully", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = validUser;
      mockReq.body = { assignedTechnicalId: 50 };

      const updatedReport = { id: 10, status: "ASSIGNED" };
      mockApproveReportService.mockResolvedValue(updatedReport as any);

      await approveReport(mockReq as Request, mockRes as Response);

      expect(mockApproveReportService).toHaveBeenCalledWith(10, validUser.id, 50);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Report approved and assigned successfully",
        report: updatedReport,
      });
    });

    it("should reject when approve reportId param is invalid", async () => {
      mockReq.params = { reportId: "abc" };
      mockReq.user = validUser;
      mockReq.body = { assignedTechnicalId: 50 };

      await expect(
        approveReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid report ID parameter");
    });
    
    it("should reject when assignedTechnicalId is missing", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = validUser;
      mockReq.body = { };

      await expect(
        approveReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should propagate service errors on approve", async () => {
      mockReq.params = { reportId: "11" };
      mockReq.user = validUser;
      mockReq.body = { assignedTechnicalId: 50 };
      
      mockApproveReportService.mockRejectedValue(new Error("DB fail"));

      await expect(
        approveReport(mockReq as Request, mockRes as Response)
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

      await rejectReport(mockReq as Request, mockRes as Response);

      expect(mockRejectReportService).toHaveBeenCalledWith(
        20,
        validUser.id,
        "Not valid content"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw when rejection reason is missing", async () => {
      mockReq.params = { reportId: "21" };
      mockReq.user = validUser;
      mockReq.body = { reason: "" };

      await expect(
        rejectReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing rejection reason");
    });

    it("should throw when reject reportId param is invalid", async () => {
      mockReq.params = { reportId: "xyz" };
      mockReq.user = validUser;
      mockReq.body = { reason: "Some reason" };

      await expect(
        rejectReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid report ID parameter");
    });
  });

  describe("getPendingReports", () => {
    it("should return pending reports", async () => {
      const mockPending = [{ id: 1, status: "PENDING_APPROVAL" }];
      mockGetPendingReportsService.mockResolvedValue(mockPending as any);

      await getPendingReports(mockReq as Request, mockRes as Response);

      expect(mockGetPendingReportsService).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockPending);
    });
  });

  describe("getAssignableTechnicals", () => {
    it("should return technicals for a report", async () => {
      mockReq.params = { reportId: "1" };
      const mockTechnicals = [{ id: 2, name: "Tech 1" }];
      mockGetAssignableTechnicalsService.mockResolvedValue(
        mockTechnicals as any
      );

      await getAssignableTechnicals(mockReq as Request, mockRes as Response);

      expect(mockGetAssignableTechnicalsService).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockTechnicals);
    });

    it("should throw error for invalid reportId", async () => {
      mockReq.params = { reportId: "invalid" };
      await expect(
        getAssignableTechnicals(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });
});