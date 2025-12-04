import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
} from "../../../src/utils/errors";

// Create mock functions at module level
const mockReportCreate = jest.fn();
const mockReportFindById = jest.fn();
const mockReportFindByIdWithRelations = jest.fn();
const mockReportFindByStatus = jest.fn();
const mockReportFindByStatusAndCategory = jest.fn();
const mockReportFindPending = jest.fn();
const mockReportUpdate = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindByRoles = jest.fn();

// Mock repositories BEFORE importing the service
jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => ({
    create: mockReportCreate,
    findById: mockReportFindById,
    findByIdWithRelations: mockReportFindByIdWithRelations,
    findByStatus: mockReportFindByStatus,
    findByStatusAndCategory: mockReportFindByStatusAndCategory,
    findPending: mockReportFindPending,
    update: mockReportUpdate,
  })),
}));

jest.mock("../../../src/repositories/ReportMessageRepository", () => ({
  ReportMessageRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findByReportId: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: mockUserFindById,
    findByRoles: mockUserFindByRoles,
  })),
}));

jest.mock("../../../src/repositories/ReportPhotoRepository", () => ({
  ReportPhotoRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    createMany: jest.fn(),
  })),
}));

jest.mock("../../../src/services/notificationService", () => ({
  notifyReportStatusChange: jest.fn(),
  notifyNewMessage: jest.fn(),
  notifyReportAssigned: jest.fn(),
  notifyReportApproved: jest.fn(),
  notifyReportRejected: jest.fn(),
}));

// Import AFTER mocks are set up
import {
  createReport,
  getApprovedReports,
  getPendingReports,
  approveReport,
  rejectReport,
  getAssignableTechnicalsForReport,
  TechnicalType,
} from "../../../src/services/reportService";

describe("reportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    it("should create basic report", async () => {
      const input = {
        title: "T",
        description: "D",
        category: ReportCategory.OTHER,
        latitude: 1,
        longitude: 1,
        userId: 1,
        photos: [],
        isAnonymous: false,
      };

      const createdReport = {
        id: 1,
        title: "T",
        description: "D",
        category: ReportCategory.OTHER,
        latitude: 1,
        longitude: 1,
        status: ReportStatus.PENDING_APPROVAL,
        userId: 1,
        user: { id: 1 },
        photos: [],
        messages: [],
      };

      // Mock the create to return the saved report with id
      mockReportCreate.mockResolvedValue({ id: 1 });
      // Mock findByIdWithRelations to return the full report
      mockReportFindByIdWithRelations.mockResolvedValue(createdReport);

      const res = await createReport(input);
      expect(mockReportCreate).toHaveBeenCalled();
      expect(res).toEqual(expect.objectContaining({ title: "T" }));
    });
  });

  describe("getApprovedReports", () => {
    it("should filter by category if provided", async () => {
      mockReportFindByStatusAndCategory.mockResolvedValue([]);
      await getApprovedReports(ReportCategory.WASTE);
      expect(mockReportFindByStatusAndCategory).toHaveBeenCalled();
    });
  });

  describe("getPendingReports", () => {
    it("should fetch pending reports", async () => {
      mockReportFindByStatus.mockResolvedValue([]);
      await getPendingReports();
      expect(mockReportFindByStatus).toHaveBeenCalled();
    });
  });

  describe("getAssignableTechnicalsForReport", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportFindById.mockResolvedValue(null);
      await expect(getAssignableTechnicalsForReport(1)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should return technicals based on category mapping", async () => {
      mockReportFindById.mockResolvedValue({
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
      });

      const mockTechnicals = [{ id: 10, role: "LOCAL_PUBLIC_SERVICES" }];
      mockUserFindByRoles.mockResolvedValue(mockTechnicals);

      const res = await getAssignableTechnicalsForReport(1);
      expect(mockUserFindByRoles).toHaveBeenCalled();
      expect(res).toEqual(mockTechnicals);
    });
  });

  describe("approveReport", () => {
    it("should throw NotFoundError if report not found", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(null);
      await expect(approveReport(1, 2, 3)).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if not pending", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue({
        id: 1,
        status: ReportStatus.ASSIGNED,
      });
      await expect(approveReport(1, 2, 3)).rejects.toThrow(BadRequestError);
    });

    it("should throw UnprocessableEntityError if technical not found", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.OTHER,
      });
      mockUserFindById.mockResolvedValue(null);

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw UnprocessableEntityError if technical role invalid for category", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
      });
      mockUserFindById.mockResolvedValue({
        id: 99,
        role: TechnicalType.WASTE_MANAGEMENT,
      });

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        UnprocessableEntityError
      );
    });
  });

  describe("rejectReport", () => {
    it("should validate reason length - empty", async () => {
      await expect(rejectReport(1, 1, "")).rejects.toThrow(BadRequestError);
    });

    it("should validate reason length - too long", async () => {
      await expect(rejectReport(1, 1, "a".repeat(501))).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw NotFound if report missing", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(null);
      await expect(rejectReport(1, 1, "Reason")).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequest if not pending", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue({ status: ReportStatus.ASSIGNED });
      await expect(rejectReport(1, 1, "Reason")).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
