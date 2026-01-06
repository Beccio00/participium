import { Request, Response } from "express";

jest.mock("../../../src/middlewares/errorMiddleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

import { getMyReports, getReportStatus } from "../../../src/controllers/telegramController";
import * as telegramService from "../../../src/services/telegramService";
import { NotFoundError } from "../../../src/utils/errors";

jest.mock("../../../src/services/telegramService");

const mockGetMyReportsFromTelegram = telegramService.getMyReportsFromTelegram as jest.MockedFunction<
  typeof telegramService.getMyReportsFromTelegram
>;
const mockGetReportStatusFromTelegram = telegramService.getReportStatusFromTelegram as jest.MockedFunction<
  typeof telegramService.getReportStatusFromTelegram
>;

describe("telegramController - Reports API", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("GET /telegram/:telegramId/reports - getMyReports", () => {
    it("should return 200 with list of reports for valid telegramId", async () => {
      const mockReports = [
        {
          reportId: 1,
          title: "Test Report 1",
          address: "Via Roma 1, Torino",
          status: "PENDING_APPROVAL",
          createdAt: "2024-01-01T10:00:00.000Z",
        },
        {
          reportId: 2,
          title: "Test Report 2",
          address: "Via Milano 5, Torino",
          status: "APPROVED",
          createdAt: "2024-01-02T10:00:00.000Z",
        },
      ];

      mockRequest = {
        params: { telegramId: "123456789" },
      };

      mockGetMyReportsFromTelegram.mockResolvedValue(mockReports);

      await getMyReports(mockRequest as Request, mockResponse as Response);

      expect(mockGetMyReportsFromTelegram).toHaveBeenCalledWith("123456789");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
    });

    it("should return empty array when user has no reports", async () => {
      mockRequest = {
        params: { telegramId: "123456789" },
      };

      mockGetMyReportsFromTelegram.mockResolvedValue([]);

      await getMyReports(mockRequest as Request, mockResponse as Response);

      expect(mockGetMyReportsFromTelegram).toHaveBeenCalledWith("123456789");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it("should propagate NotFoundError when telegramId is not linked", async () => {
      mockRequest = {
        params: { telegramId: "999999999" },
      };

      mockGetMyReportsFromTelegram.mockRejectedValue(
        new NotFoundError("No account linked to this Telegram ID. Please link your account first.")
      );

      await expect(
        getMyReports(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);

      expect(mockGetMyReportsFromTelegram).toHaveBeenCalledWith("999999999");
    });

    it("should handle telegramId as string parameter", async () => {
      mockRequest = {
        params: { telegramId: "telegram_user_abc123" },
      };

      mockGetMyReportsFromTelegram.mockResolvedValue([]);

      await getMyReports(mockRequest as Request, mockResponse as Response);

      expect(mockGetMyReportsFromTelegram).toHaveBeenCalledWith("telegram_user_abc123");
    });
  });

  describe("GET /telegram/:telegramId/reports/:reportId - getReportStatus", () => {
    it("should return 200 with report details for valid telegramId and reportId", async () => {
      const mockReportStatus = {
        reportId: 1,
        title: "Test Report",
        description: "This is a test report description",
        category: "OTHER",
        address: "Via Roma 1, Torino",
        isAnonymous: false,
        photoUrls: ["http://minio/bucket/photo1.jpg"],
        status: "APPROVED",
        createdAt: "2024-01-01T10:00:00.000Z",
      };

      mockRequest = {
        params: { telegramId: "123456789", reportId: "1" },
      };

      mockGetReportStatusFromTelegram.mockResolvedValue(mockReportStatus);

      await getReportStatus(mockRequest as Request, mockResponse as Response);

      expect(mockGetReportStatusFromTelegram).toHaveBeenCalledWith("123456789", 1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReportStatus);
    });

    it("should return report with rejectedReason when status is REJECTED", async () => {
      const mockReportStatus = {
        reportId: 2,
        title: "Rejected Report",
        description: "This report was rejected",
        category: "ROAD_MAINTENANCE",
        address: "Via Milano 5, Torino",
        isAnonymous: true,
        photoUrls: [],
        status: "REJECTED",
        createdAt: "2024-01-01T10:00:00.000Z",
        rejectedReason: "Not within municipality jurisdiction",
      };

      mockRequest = {
        params: { telegramId: "123456789", reportId: "2" },
      };

      mockGetReportStatusFromTelegram.mockResolvedValue(mockReportStatus);

      await getReportStatus(mockRequest as Request, mockResponse as Response);

      expect(mockGetReportStatusFromTelegram).toHaveBeenCalledWith("123456789", 2);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReportStatus);
    });

    it("should propagate NotFoundError when telegramId is not linked", async () => {
      mockRequest = {
        params: { telegramId: "999999999", reportId: "1" },
      };

      mockGetReportStatusFromTelegram.mockRejectedValue(
        new NotFoundError("No account linked to this Telegram ID. Please link your account first.")
      );

      await expect(
        getReportStatus(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);

      expect(mockGetReportStatusFromTelegram).toHaveBeenCalledWith("999999999", 1);
    });

    it("should propagate NotFoundError when report does not belong to user", async () => {
      mockRequest = {
        params: { telegramId: "123456789", reportId: "999" },
      };

      mockGetReportStatusFromTelegram.mockRejectedValue(
        new NotFoundError("Report not found for this user.")
      );

      await expect(
        getReportStatus(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);

      expect(mockGetReportStatusFromTelegram).toHaveBeenCalledWith("123456789", 999);
    });

    it("should parse reportId as integer", async () => {
      const mockReportStatus = {
        reportId: 42,
        title: "Test Report",
        description: "Description",
        category: "OTHER",
        address: "Via Test 1, Torino",
        isAnonymous: false,
        photoUrls: [],
        status: "PENDING_APPROVAL",
        createdAt: "2024-01-01T10:00:00.000Z",
      };

      mockRequest = {
        params: { telegramId: "123456789", reportId: "42" },
      };

      mockGetReportStatusFromTelegram.mockResolvedValue(mockReportStatus);

      await getReportStatus(mockRequest as Request, mockResponse as Response);

      expect(mockGetReportStatusFromTelegram).toHaveBeenCalledWith("123456789", 42);
    });

    it("should handle multiple photos in photoUrls", async () => {
      const mockReportStatus = {
        reportId: 1,
        title: "Report with Photos",
        description: "Multiple photos test",
        category: "WASTE_MANAGEMENT",
        address: "Piazza Castello, Torino",
        isAnonymous: false,
        photoUrls: [
          "http://minio/bucket/photo1.jpg",
          "http://minio/bucket/photo2.jpg",
          "http://minio/bucket/photo3.jpg",
        ],
        status: "IN_PROGRESS",
        createdAt: "2024-01-01T10:00:00.000Z",
      };

      mockRequest = {
        params: { telegramId: "123456789", reportId: "1" },
      };

      mockGetReportStatusFromTelegram.mockResolvedValue(mockReportStatus);

      await getReportStatus(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          photoUrls: expect.arrayContaining([
            "http://minio/bucket/photo1.jpg",
            "http://minio/bucket/photo2.jpg",
            "http://minio/bucket/photo3.jpg",
          ]),
        })
      );
    });
  });
});
