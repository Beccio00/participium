import { NotFoundError } from "../../../src/utils/errors";
import { ReportStatus } from "../../../../shared/ReportTypes";

// Create mock functions at module level
const mockUserFindByTelegramId = jest.fn();
const mockReportFindByUserId = jest.fn();

// Mock repositories BEFORE importing the service
jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    findByTelegramId: mockUserFindByTelegramId,
    update: jest.fn(),
  })),
}));

jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => ({
    findByUserId: mockReportFindByUserId,
    create: jest.fn(),
    findById: jest.fn(),
  })),
}));

jest.mock("../../../src/repositories/TelegramLinkTokenRepository", () => ({
  TelegramLinkTokenRepository: jest.fn().mockImplementation(() => ({
    findByToken: jest.fn(),
    create: jest.fn(),
    deleteByUserId: jest.fn(),
    markAsUsed: jest.fn(),
  })),
}));

jest.mock("../../../src/services/reportService", () => ({
  createReport: jest.fn(),
}));

jest.mock("../../../src/utils/minioClient", () => ({
  __esModule: true,
  default: { putObject: jest.fn().mockResolvedValue(undefined) },
  BUCKET_NAME: "reports-photos",
}));

jest.mock("../../../src/utils/addressFinder", () => ({
  calculateAddress: jest.fn().mockResolvedValue("Via Test 1, Torino"),
}));

jest.mock("axios");

// Import AFTER mocks are set up
import {
  getMyReportsFromTelegram,
  getReportStatusFromTelegram,
} from "../../../src/services/telegramService";

describe("telegramService - Reports API", () => {
  const mockDate = new Date("2024-01-01T10:00:00.000Z");

  // Helper to create mock user
  const createMockUser = (overrides: any = {}) => ({
    id: 1,
    email: "test@example.com",
    first_name: "Mario",
    last_name: "Rossi",
    telegram_id: "123456789",
    telegram_username: "mariorossi",
    ...overrides,
  });

  // Helper to create mock report
  const createMockReport = (overrides: any = {}) => ({
    id: 1,
    title: "Test Report",
    description: "Test description",
    category: "OTHER",
    latitude: 45.0703,
    longitude: 7.6869,
    address: "Via Roma 1, Torino",
    status: ReportStatus.PENDING_APPROVAL,
    isAnonymous: false,
    userId: 1,
    createdAt: mockDate,
    updatedAt: mockDate,
    photos: [],
    rejectedReason: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyReportsFromTelegram", () => {
    it("should return list of reports for valid telegramId", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({ id: 1, title: "Report 1" }),
        createMockReport({ id: 2, title: "Report 2", status: ReportStatus.ASSIGNED }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getMyReportsFromTelegram("123456789");

      expect(mockUserFindByTelegramId).toHaveBeenCalledWith("123456789");
      expect(mockReportFindByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        reportId: 1,
        title: "Report 1",
        address: "Via Roma 1, Torino",
        status: ReportStatus.PENDING_APPROVAL,
        createdAt: mockDate.toISOString(),
      });
      expect(result[1]).toEqual({
        reportId: 2,
        title: "Report 2",
        address: "Via Roma 1, Torino",
        status: ReportStatus.ASSIGNED,
        createdAt: mockDate.toISOString(),
      });
    });

    it("should return empty array when user has no reports", async () => {
      const mockUser = createMockUser();

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue([]);

      const result = await getMyReportsFromTelegram("123456789");

      expect(result).toEqual([]);
    });

    it("should throw NotFoundError when telegramId is not linked to any user", async () => {
      mockUserFindByTelegramId.mockResolvedValue(null);

      await expect(getMyReportsFromTelegram("999999999")).rejects.toThrow(NotFoundError);
      await expect(getMyReportsFromTelegram("999999999")).rejects.toThrow(
        "No account linked to this Telegram ID. Please link your account first."
      );
    });

    it("should return 'Address not available' when report has no address", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ address: null })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getMyReportsFromTelegram("123456789");

      expect(result[0].address).toBe("Address not available");
    });

    it("should return reports with correct ISO date format", async () => {
      const mockUser = createMockUser();
      const specificDate = new Date("2024-06-15T14:30:00.000Z");
      const mockReports = [createMockReport({ createdAt: specificDate })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getMyReportsFromTelegram("123456789");

      expect(result[0].createdAt).toBe("2024-06-15T14:30:00.000Z");
    });

    it("should handle reports with various statuses", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({ id: 1, status: ReportStatus.PENDING_APPROVAL }),
        createMockReport({ id: 2, status: ReportStatus.ASSIGNED }),
        createMockReport({ id: 3, status: ReportStatus.REJECTED }),
        createMockReport({ id: 4, status: ReportStatus.IN_PROGRESS }),
        createMockReport({ id: 5, status: ReportStatus.RESOLVED }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getMyReportsFromTelegram("123456789");

      expect(result).toHaveLength(5);
      expect(result.map((r) => r.status)).toEqual([
        ReportStatus.PENDING_APPROVAL,
        ReportStatus.ASSIGNED,
        ReportStatus.REJECTED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ]);
    });
  });

  describe("getReportStatusFromTelegram", () => {
    it("should return full report details for valid telegramId and reportId", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({
          id: 1,
          photos: [{ url: "http://minio/bucket/photo1.jpg" }],
        }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(mockUserFindByTelegramId).toHaveBeenCalledWith("123456789");
      expect(mockReportFindByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        reportId: 1,
        title: "Test Report",
        description: "Test description",
        category: "OTHER",
        address: "Via Roma 1, Torino",
        isAnonymous: false,
        photoUrls: ["http://minio/bucket/photo1.jpg"],
        status: ReportStatus.PENDING_APPROVAL,
        createdAt: mockDate.toISOString(),
        rejectedReason: undefined,
      });
    });

    it("should throw NotFoundError when telegramId is not linked to any user", async () => {
      mockUserFindByTelegramId.mockResolvedValue(null);

      await expect(getReportStatusFromTelegram("999999999", 1)).rejects.toThrow(NotFoundError);
      await expect(getReportStatusFromTelegram("999999999", 1)).rejects.toThrow(
        "No account linked to this Telegram ID. Please link your account first."
      );
    });

    it("should throw NotFoundError when report does not belong to user", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ id: 1 })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      await expect(getReportStatusFromTelegram("123456789", 999)).rejects.toThrow(NotFoundError);
      await expect(getReportStatusFromTelegram("123456789", 999)).rejects.toThrow(
        "Report not found for this user."
      );
    });

    it("should include rejectedReason when report is rejected", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({
          id: 1,
          status: ReportStatus.REJECTED,
          rejectedReason: "Not within municipality jurisdiction",
        }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.status).toBe(ReportStatus.REJECTED);
      expect(result.rejectedReason).toBe("Not within municipality jurisdiction");
    });

    it("should return undefined rejectedReason when not rejected", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({
          id: 1,
          status: ReportStatus.ASSIGNED,
          rejectedReason: null,
        }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.rejectedReason).toBeUndefined();
    });

    it("should return empty photoUrls array when report has no photos", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ id: 1, photos: null })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.photoUrls).toEqual([]);
    });

    it("should return multiple photo URLs when report has multiple photos", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({
          id: 1,
          photos: [
            { url: "http://minio/bucket/photo1.jpg" },
            { url: "http://minio/bucket/photo2.jpg" },
            { url: "http://minio/bucket/photo3.jpg" },
          ],
        }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.photoUrls).toHaveLength(3);
      expect(result.photoUrls).toEqual([
        "http://minio/bucket/photo1.jpg",
        "http://minio/bucket/photo2.jpg",
        "http://minio/bucket/photo3.jpg",
      ]);
    });

    it("should return 'Address not available' when report has no address", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ id: 1, address: null })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.address).toBe("Address not available");
    });

    it("should find correct report when user has multiple reports", async () => {
      const mockUser = createMockUser();
      const mockReports = [
        createMockReport({ id: 1, title: "First Report" }),
        createMockReport({ id: 5, title: "Fifth Report" }),
        createMockReport({ id: 10, title: "Tenth Report" }),
      ];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 5);

      expect(result.reportId).toBe(5);
      expect(result.title).toBe("Fifth Report");
    });

    it("should handle anonymous reports correctly", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ id: 1, isAnonymous: true })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.isAnonymous).toBe(true);
    });

    it("should return correct category", async () => {
      const mockUser = createMockUser();
      const mockReports = [createMockReport({ id: 1, category: "ROAD_MAINTENANCE" })];

      mockUserFindByTelegramId.mockResolvedValue(mockUser);
      mockReportFindByUserId.mockResolvedValue(mockReports);

      const result = await getReportStatusFromTelegram("123456789", 1);

      expect(result.category).toBe("ROAD_MAINTENANCE");
    });
  });
});
