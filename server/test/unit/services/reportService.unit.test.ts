import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
  ForbiddenError,
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
  let reportService: any;
  const mockDate = new Date("2023-01-01T00:00:00.000Z");

  // Helper to generate a "DB Entity"
  const createMockReportEntity = (overrides: any = {}) => ({
    id: 1,
    title: "Test Report",
    description: "Desc",
    category: ReportCategory.OTHER,
    latitude: 10,
    longitude: 10,
    status: ReportStatus.PENDING_APPROVAL,
    userId: 1,
    createdAt: mockDate,
    updatedAt: mockDate,
    user: { id: 1, role: "CITIZEN", email: "c@test.com" },
    photos: [],
    messages: [],
    ...overrides,
  });

  // 5. Import the service dynamically BEFORE tests run
  beforeAll(async () => {
    reportService = await import("../../../src/services/reportService");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Create Report ---
  describe("createReport", () => {
    it("should create a report and photos successfully", async () => {
      const input = {
        title: "T",
        description: "D",
        category: ReportCategory.OTHER,
        latitude: 1,
        longitude: 1,
        userId: 1,
        photos: [{ 
            id: 0, 
            filename: "f.jpg", 
            url: "http://u", 
            size: 100, 
            mimetype: "image/jpeg", 
            originalname: "o", 
            buffer: Buffer.from([]) 
        }],
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

  // --- 2. Get Lists ---
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

  // --- 3. Get Assignable Technicals ---
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

  // --- 4. Approve Report ---
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

    it("should throw UnprocessableEntityError if technical has wrong role", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ category: ReportCategory.WATER_SUPPLY_DRINKING_WATER }));
      mockUserRepo.findById.mockResolvedValue({ id: 99, role: "WRONG_ROLE" });

      await expect(reportService.approveReport(1, 2, 99)).rejects.toThrow(UnprocessableEntityError);
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

    it("should succeed, update status, and notify", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());
      mockUserRepo.findById.mockResolvedValue({ id: 99, role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE });
      mockReportRepo.update.mockResolvedValue(createMockReportEntity({ 
        status: ReportStatus.ASSIGNED, 
        assignedOfficerId: 99 
      }));

      const res = await reportService.approveReport(1, 2, 99);
      expect(mockReportRepo.update).toHaveBeenCalled();
      expect(res.status).toBe(ReportStatus.ASSIGNED);
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