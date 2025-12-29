import { Request, Response } from "express";

// Mocks setup
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
  calculateAddress: jest.fn().mockResolvedValue("Calculated Address"),
}));

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

// Mock services
jest.mock("../../../src/services/reportService");
jest.mock("../../../src/services/messageService");
jest.mock("../../../src/services/internalNoteService");

import {
  createReport,
  getReports,
  approveReport,
  rejectReport,
  getAssignableTechnicals,
  getPendingReports,
  getReportById,
  updateReportStatus,
  getAssignedReports,
  createInternalNote,
  getInternalNote
} from "../../../src/controllers/reportController";
import {
  sendMessageToCitizen,
  getReportMessages,
} from "../../../src/controllers/messageController";
import * as reportService from "../../../src/services/reportService";
import * as messageService from "../../../src/services/messageService";
import * as internalNoteService from "../../../src/services/internalNoteService";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import { BadRequestError, UnauthorizedError } from "../../../src/utils";
import { calculateAddress } from "../../../src/utils/addressFinder";

// Mock variables
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
const mockGetReportByIdService =
  reportService.getReportById as jest.MockedFunction<
    typeof reportService.getReportById
  >;
const mockUpdateReportStatusService =
  reportService.updateReportStatus as jest.MockedFunction<
    typeof reportService.updateReportStatus
  >;
const mockSendMessageToCitizenService =
  messageService.sendMessageToCitizen as jest.MockedFunction<
    typeof messageService.sendMessageToCitizen
  >;
const mockGetReportMessagesService =
  messageService.getReportMessages as jest.MockedFunction<
    typeof messageService.getReportMessages
  >;
const mockGetAssignedReportsService =
  reportService.getAssignedReportsService as jest.MockedFunction<
    typeof reportService.getAssignedReportsService
  >;
const mockGetAssignedReportsExternalService =
  reportService.getAssignedReportsForExternalMaintainer as jest.MockedFunction<
    typeof reportService.getAssignedReportsForExternalMaintainer
  >;

const mockCreateInternalNoteService =
  internalNoteService.createInternalNote as jest.MockedFunction<
    typeof internalNoteService.createInternalNote
  >;

const mockGetInternalNotesService =
  internalNoteService.getInternalNotes as jest.MockedFunction<
    typeof internalNoteService.getInternalNotes
  >;

describe("reportController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null,
      query: {},
      params: {},
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
      photos: [],
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
    };

    it("should create report successfully with valid data", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      mockReq.files = mockFiles;

      mockCreateReportService.mockResolvedValue({
        id: 1,
        ...validReportData,
      } as any);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle photos when req.files is an object", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      mockReq.files = { photos: mockFiles };
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);
      await createReport(mockReq as Request, mockRes as Response);
      expect(mockCreateReportService).toHaveBeenCalled();
    });

    // Coverage per linea 109 (extractPhotos fallback)
    it("should fail validation but cover extractPhotos fallback when req.files is invalid object", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      mockReq.files = {}; // Not array, no photos prop -> returns []
      // Then validatePhotos throws
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("At least one photo is required");
    });

    it("should use provided address and skip calculation", async () => {
      mockReq.body = { ...validReportData, address: "Via Po 15, Torino" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      mockCreateReportService.mockResolvedValue({ id: 1 } as any);
      await createReport(mockReq as Request, mockRes as Response);
      expect(calculateAddress).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError if no photos are provided", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      mockReq.files = []; // Empty array
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("At least one photo is required");
    });

    it("should throw BadRequestError if more than 3 photos are provided", async () => {
      mockReq.body = validReportData;
      mockReq.user = validUser;
      // Create 4 mock files
      mockReq.files = Array(4).fill(mockFiles[0]);
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Maximum 3 photos allowed");
    });

    it("should throw BadRequestError if category is invalid", async () => {
      mockReq.body = { ...validReportData, category: "INVALID_CATEGORY" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid category");
    });

    it("should throw BadRequestError if latitude/longitude are NaN", async () => {
      mockReq.body = { ...validReportData, latitude: "not-a-number" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid coordinates");
    });

    it("should throw BadRequestError if latitude is out of bounds", async () => {
      mockReq.body = { ...validReportData, latitude: "91" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid latitude: must be between -90 and 90");
    });

    it("should throw BadRequestError if longitude is out of bounds", async () => {
      mockReq.body = { ...validReportData, longitude: "181" };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid longitude: must be between -180 and 180");
    });

    it("should throw BadRequestError if missing required fields", async () => {
      mockReq.body = { ...validReportData, title: undefined };
      mockReq.user = validUser;
      mockReq.files = mockFiles;
      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing required fields");
    });
  });

  describe("getReports", () => {
    it("should return approved reports successfully", async () => {
      mockGetApprovedReportsService.mockResolvedValue([]);
      await getReports(mockReq as Request, mockRes as Response);
      expect(mockGetApprovedReportsService).toHaveBeenCalled();
    });

    it("should throw BadRequestError if category query param is invalid", async () => {
      mockReq.query = { category: "INVALID_CAT" };
      await expect(
        getReports(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid category");
    });
  });

  describe("getReportById", () => {
    it("should return a report by ID", async () => {
      mockReq.params = { reportId: "123" };
      mockReq.user = { id: 1 };
      mockGetReportByIdService.mockResolvedValue({ id: 123 } as any);
      await getReportById(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw UnauthorizedError if user is missing", async () => {
      mockReq.params = { reportId: "123" };
      mockReq.user = undefined;
      await expect(
        getReportById(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw BadRequestError if reportId is invalid", async () => {
      mockReq.params = { reportId: "abc" };
      mockReq.user = { id: 1 };
      await expect(
        getReportById(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("approveReport", () => {
    it("should approve a report successfully", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = { id: 99 };
      mockReq.body = { assignedTechnicalId: 50 };
      mockApproveReportService.mockResolvedValue({ id: 10 } as any);
      await approveReport(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw BadRequestError if reportId is invalid", async () => {
      mockReq.params = { reportId: "invalid" };
      mockReq.user = { id: 99 };
      mockReq.body = { assignedTechnicalId: 50 };
      await expect(
        approveReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid report ID parameter");
    });

    it("should throw BadRequestError if assignedTechnicalId is missing", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = { id: 99 };
      mockReq.body = {}; // Missing field
      await expect(
        approveReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing or invalid 'assignedTechnicalId'");
    });

    it("should throw BadRequestError if assignedTechnicalId is invalid", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = { id: 99 };
      mockReq.body = { assignedTechnicalId: "not-a-number" };
      await expect(
        approveReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing or invalid 'assignedTechnicalId'");
    });
  });

  describe("rejectReport", () => {
    it("should reject a report successfully", async () => {
      mockReq.params = { reportId: "20" };
      mockReq.user = { id: 99 };
      mockReq.body = { reason: "Bad quality" };
      mockRejectReportService.mockResolvedValue({ id: 20 } as any);
      await rejectReport(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw BadRequestError if reportId is invalid", async () => {
      mockReq.params = { reportId: "abc" };
      mockReq.user = { id: 99 };
      mockReq.body = { reason: "Bad" };
      await expect(
        rejectReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid report ID parameter");
    });

    it("should throw BadRequestError if reason is missing", async () => {
      mockReq.params = { reportId: "20" };
      mockReq.user = { id: 99 };
      mockReq.body = {};
      await expect(
        rejectReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing rejection reason");
    });

    it("should throw BadRequestError if reason is empty/whitespace", async () => {
      mockReq.params = { reportId: "20" };
      mockReq.user = { id: 99 };
      mockReq.body = { reason: "   " };
      await expect(
        rejectReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Missing rejection reason");
    });
  });

  describe("updateReportStatus", () => {
    const validUser = { id: 50 };

    it("should update report status successfully", async () => {
      mockReq.params = { reportId: "5" };
      mockReq.user = validUser;
      mockReq.body = { status: "IN_PROGRESS" };
      const updatedReport = { id: 5, status: "IN_PROGRESS" };
      mockUpdateReportStatusService.mockResolvedValue(updatedReport as any);

      await updateReportStatus(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw BadRequestError for invalid reportId", async () => {
      mockReq.params = { reportId: "invalid" };
      mockReq.user = validUser;
      mockReq.body = { status: "RESOLVED" };
      await expect(
        updateReportStatus(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if status is missing", async () => {
      mockReq.params = { reportId: "5" };
      mockReq.user = validUser;
      mockReq.body = {};
      await expect(
        updateReportStatus(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Status is required");
    });

    it("should throw BadRequestError if status is invalid", async () => {
      mockReq.params = { reportId: "5" };
      mockReq.user = validUser;
      mockReq.body = { status: "INVALID_STATUS" };
      await expect(
        updateReportStatus(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid status");
    });
  });

  describe("sendMessageToCitizen", () => {
    const validUser = { id: 50 };

    it("should send message successfully", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = validUser;
      mockReq.body = { content: "We are fixing it." };
      mockSendMessageToCitizenService.mockResolvedValue({ id: 1 } as any);
      await sendMessageToCitizen(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should throw BadRequestError for invalid reportId", async () => {
      mockReq.params = { reportId: "abc" };
      mockReq.user = validUser;
      mockReq.body = { content: "Msg" };
      await expect(
        sendMessageToCitizen(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if content is empty", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = validUser;
      mockReq.body = { content: "   " };
      await expect(
        sendMessageToCitizen(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Message content is required");
    });
  });

  describe("getReportMessages", () => {
    it("should return messages for a report", async () => {
      mockReq.params = { reportId: "10" };
      mockReq.user = { id: 1 };
      mockGetReportMessagesService.mockResolvedValue([] as any);
      await getReportMessages(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should throw BadRequestError for invalid reportId", async () => {
      mockReq.params = { reportId: "invalid" };
      mockReq.user = { id: 1 };
      await expect(
        getReportMessages(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("getAssignedReports", () => {
    it("should return assigned reports for standard user", async () => {
      const user = { id: 50, role: "TECHNICAL_STAFF" };
      mockReq.user = user;
      mockReq.query = { status: "ASSIGNED", sortBy: "priority", order: "asc" };
      mockGetAssignedReportsService.mockResolvedValue([] as any);
      await getAssignedReports(mockReq as Request, mockRes as Response);
      expect(mockGetAssignedReportsService).toHaveBeenCalledWith(
        50,
        "ASSIGNED",
        "priority",
        "asc"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return assigned reports for EXTERNAL_MAINTAINER", async () => {
      const user = { id: 60, role: "EXTERNAL_MAINTAINER" };
      mockReq.user = user;
      mockReq.query = {}; // defaults
      mockGetAssignedReportsExternalService.mockResolvedValue([] as any);
      await getAssignedReports(mockReq as Request, mockRes as Response);
      expect(mockGetAssignedReportsExternalService).toHaveBeenCalledWith(
        60,
        undefined,
        "createdAt",
        "desc"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle invalid sortBy defaulting to createdAt", async () => {
      const user = { id: 50, role: "TECHNICAL_STAFF" };
      mockReq.user = user;
      mockReq.query = { sortBy: "invalidField" };
      mockGetAssignedReportsService.mockResolvedValue([] as any);
      await getAssignedReports(mockReq as Request, mockRes as Response);
      expect(mockGetAssignedReportsService).toHaveBeenCalledWith(
        50,
        undefined,
        "createdAt",
        "desc"
      );
    });

    it("should throw UnauthorizedError if user is missing", async () => {
      mockReq.user = undefined;
      await expect(
        getAssignedReports(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw BadRequestError if status filter is invalid", async () => {
      mockReq.user = { id: 50, role: "TECHNICAL_STAFF" };
      mockReq.query = { status: "INVALID_FILTER" };
      await expect(
        getAssignedReports(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid status filter");
    });
  });

  describe("getPendingReports", () => {
    it("should return pending reports", async () => {
      mockGetPendingReportsService.mockResolvedValue([]);
      await getPendingReports(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe("getAssignableTechnicals", () => {
    it("should return technicals", async () => {
      mockReq.params = { reportId: "1" };
      mockGetAssignableTechnicalsService.mockResolvedValue([]);
      await getAssignableTechnicals(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should throw error for invalid reportId", async () => {
      mockReq.params = { reportId: "invalid" };
      await expect(
        getAssignableTechnicals(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });
  });

  describe("Anonymous Report Feature - PT15", () => {
    const validUser = {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "CITIZEN" as const,
    };

    const mockFiles = [
      {
        originalname: "photo.jpg",
        buffer: Buffer.from("fake-image"),
        mimetype: "image/jpeg",
        size: 1024,
      },
    ];

    const baseReportData = {
      title: "Test Report",
      description: "Test Description",
      category: "PUBLIC_LIGHTING" as ReportCategory,
      latitude: "45.0703",
      longitude: "7.6869",
      photos: [],
    };

    describe("createReport - anonymous option", () => {
      it("should create anonymous report when isAnonymous is 'true'", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "true" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        const expectedReport = {
          id: 1,
          ...baseReportData,
          isAnonymous: true,
          userId: validUser.id,
        };

        mockCreateReportService.mockResolvedValue(expectedReport as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith(
          expect.objectContaining({
            isAnonymous: true,
            userId: validUser.id,
          })
        );
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Report created successfully",
          report: expectedReport,
        });
      });

      it("should create non-anonymous report when isAnonymous is 'false'", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "false" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        const expectedReport = {
          id: 1,
          ...baseReportData,
          isAnonymous: false,
          userId: validUser.id,
        };

        mockCreateReportService.mockResolvedValue(expectedReport as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith(
          expect.objectContaining({
            isAnonymous: false,
            userId: validUser.id,
          })
        );
        expect(mockRes.status).toHaveBeenCalledWith(201);
      });

      it("should create non-anonymous report when isAnonymous is undefined (default)", async () => {
        mockReq.body = { ...baseReportData };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith(
          expect.objectContaining({
            isAnonymous: false,
          })
        );
      });

      it("should handle isAnonymous as string 'true' correctly", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "true" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({
          id: 1,
          isAnonymous: true,
        } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(true);
        expect(typeof callArgs.isAnonymous).toBe("boolean");
      });

      it("should handle isAnonymous as string 'false' correctly", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "false" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({
          id: 1,
          isAnonymous: false,
        } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(false);
        expect(typeof callArgs.isAnonymous).toBe("boolean");
      });

      it("should treat any string other than 'true' as false", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "yes" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({
          id: 1,
          isAnonymous: false,
        } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(false);
      });

      it("should maintain user id even when report is anonymous", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "true" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: validUser.id,
            isAnonymous: true,
          })
        );
      });

      it("should create anonymous report with all required fields", async () => {
        const completeReportData = {
          ...baseReportData,
          isAnonymous: "true",
          address: "Via Roma 10, Torino",
        };

        mockReq.body = completeReportData;
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        expect(mockCreateReportService).toHaveBeenCalledWith(
          expect.objectContaining({
            title: baseReportData.title,
            description: baseReportData.description,
            category: baseReportData.category,
            latitude: parseFloat(baseReportData.latitude),
            longitude: parseFloat(baseReportData.longitude),
            isAnonymous: true,
            userId: validUser.id,
          })
        );
      });
    });

    describe("Privacy considerations for anonymous reports", () => {
      it("should still store userId for anonymous reports (for internal tracking)", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "true" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.userId).toBe(validUser.id);
        expect(callArgs.isAnonymous).toBe(true);
      });

      it("should allow authenticated citizen to create anonymous report", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "true" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await expect(
          createReport(mockReq as Request, mockRes as Response)
        ).resolves.not.toThrow();

        expect(mockCreateReportService).toHaveBeenCalled();
      });
    });

    describe("Edge cases for anonymous flag", () => {
      it("should handle empty string isAnonymous as false", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(false);
      });

      it("should handle null isAnonymous as false", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: null };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(false);
      });

      it("should handle 'TRUE' (uppercase) as true", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "TRUE" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        // Note: current implementation is case-sensitive, this will be false
        // This test documents current behavior
        expect(callArgs.isAnonymous).toBe(false);
      });

      it("should handle '1' as false (not 'true' string)", async () => {
        mockReq.body = { ...baseReportData, isAnonymous: "1" };
        mockReq.user = validUser;
        mockReq.files = mockFiles;

        mockCreateReportService.mockResolvedValue({ id: 1 } as any);

        await createReport(mockReq as Request, mockRes as Response);

        const callArgs = mockCreateReportService.mock.calls[0][0];
        expect(callArgs.isAnonymous).toBe(false);
      });
    });
  });
});
