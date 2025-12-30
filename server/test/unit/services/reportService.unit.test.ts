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
  updateReportStatus,
  TechnicalType,
} from "../../../src/services/reportService";
import * as notificationService from "../../../src/services/notificationService";

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
        photos: [
          {
            id: 0,
            filename: "f.jpg",
            url: "http://u",
            size: 100,
            mimetype: "image/jpeg",
            originalname: "o",
            buffer: Buffer.from([]),
          },
        ],
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

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw UnprocessableEntityError if technical has wrong role", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(
        createMockReportEntity({
          category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
        })
      );
      mockUserFindById.mockResolvedValue({ id: 99, role: "WRONG_ROLE" });

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

    it("should succeed, update status, and notify", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(
        createMockReportEntity()
      );
      mockUserFindById.mockResolvedValue({
        id: 99,
        role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
      });
      mockReportUpdate.mockResolvedValue(
        createMockReportEntity({
          status: ReportStatus.ASSIGNED,
          assignedOfficerId: 99,
        })
      );

      const res = await approveReport(1, 2, 99);
      expect(mockReportUpdate).toHaveBeenCalled();
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
      mockReportFindByIdWithRelations.mockResolvedValue({
        status: ReportStatus.ASSIGNED,
      });
      await expect(rejectReport(1, 1, "Reason")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  // --- 6. Update Report Status (Technical/External Staff) ---
  describe("updateReportStatus", () => {
    const mockNotifyStatusChange =
      notificationService.notifyReportStatusChange as jest.MockedFunction<
        typeof notificationService.notifyReportStatusChange
      >;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should throw NotFoundError if report not found", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(null);
      await expect(
        updateReportStatus(1, 50, ReportStatus.IN_PROGRESS)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if user is not assigned to report", async () => {
      const report = createMockReportEntity({
        assignedOfficerId: 100,
        externalMaintainerId: null,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);

      await expect(
        updateReportStatus(1, 50, ReportStatus.IN_PROGRESS)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should successfully update status when user is assigned internal technical", async () => {
      const oldStatus = ReportStatus.ASSIGNED;
      const newStatus = ReportStatus.IN_PROGRESS;
      const report = createMockReportEntity({
        id: 10,
        status: oldStatus,
        assignedOfficerId: 50,
        userId: 100,
      });

      const updatedReport = { ...report, status: newStatus };
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(updatedReport);

      const result = await updateReportStatus(10, 50, newStatus);

      expect(mockReportUpdate).toHaveBeenCalledWith(10, { status: newStatus });
      expect(mockNotifyStatusChange).toHaveBeenCalledWith(
        10,
        100,
        oldStatus,
        newStatus
      );
      expect(result.status).toBe(newStatus);
    });

    it("should successfully update status when user is assigned external maintainer", async () => {
      const oldStatus = ReportStatus.EXTERNAL_ASSIGNED;
      const newStatus = ReportStatus.IN_PROGRESS;
      const report = createMockReportEntity({
        id: 15,
        status: oldStatus,
        assignedOfficerId: null,
        externalMaintainerId: 60,
        userId: 105,
      });

      const updatedReport = { ...report, status: newStatus };
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(updatedReport);

      const result = await updateReportStatus(15, 60, newStatus);

      expect(mockReportUpdate).toHaveBeenCalledWith(15, { status: newStatus });
      expect(mockNotifyStatusChange).toHaveBeenCalledWith(
        15,
        105,
        oldStatus,
        newStatus
      );
      expect(result.status).toBe(newStatus);
    });

    it("should update status to SUSPENDED and notify citizen", async () => {
      const report = createMockReportEntity({
        id: 20,
        status: ReportStatus.IN_PROGRESS,
        assignedOfficerId: 50,
        userId: 110,
      });

      const updatedReport = { ...report, status: ReportStatus.SUSPENDED };
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(updatedReport);

      await updateReportStatus(20, 50, ReportStatus.SUSPENDED);

      expect(mockNotifyStatusChange).toHaveBeenCalledWith(
        20,
        110,
        ReportStatus.IN_PROGRESS,
        ReportStatus.SUSPENDED
      );
    });

    it("should update status to RESOLVED and notify citizen", async () => {
      const report = createMockReportEntity({
        id: 25,
        status: ReportStatus.IN_PROGRESS,
        assignedOfficerId: 50,
        userId: 115,
      });

      const updatedReport = { ...report, status: ReportStatus.RESOLVED };
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(updatedReport);

      await updateReportStatus(25, 50, ReportStatus.RESOLVED);

      expect(mockReportUpdate).toHaveBeenCalledWith(25, {
        status: ReportStatus.RESOLVED,
      });
      expect(mockNotifyStatusChange).toHaveBeenCalledWith(
        25,
        115,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED
      );
    });

    it("should throw NotFoundError if report not found after update", async () => {
      const report = createMockReportEntity({
        assignedOfficerId: 50,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(null);

      await expect(
        updateReportStatus(1, 50, ReportStatus.IN_PROGRESS)
      ).rejects.toThrow(NotFoundError);
    });

    it("should track old status correctly for notification", async () => {
      const report = createMockReportEntity({
        id: 30,
        status: ReportStatus.SUSPENDED,
        assignedOfficerId: 50,
        userId: 120,
      });

      const updatedReport = { ...report, status: ReportStatus.IN_PROGRESS };
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(updatedReport);

      await updateReportStatus(30, 50, ReportStatus.IN_PROGRESS);

      // Verify the old status is passed correctly
      expect(mockNotifyStatusChange).toHaveBeenCalledWith(
        30,
        120,
        ReportStatus.SUSPENDED, // old status
        ReportStatus.IN_PROGRESS // new status
      );
    });
  });
});
