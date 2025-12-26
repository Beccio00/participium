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
const mockReportFindAssignedToUser = jest.fn(); // Added
const mockReportFindAssignedToExternalMaintainer = jest.fn(); // Added
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
    findAssignedToUser: mockReportFindAssignedToUser, // Added
    findAssignedToExternalMaintainer: mockReportFindAssignedToExternalMaintainer, // Added
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
  getReportById,
  getAssignedReportsService,
  getAssignedReportsForExternalMaintainer,
  updateReportStatus,
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

  // Import the service dynamically BEFORE tests run
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

      const createdReport = createMockReportEntity();

      // Mock the create to return the saved report with id
      mockReportCreate.mockResolvedValue({ id: 1 });
      // Mock findByIdWithRelations to return the full report
      mockReportFindByIdWithRelations.mockResolvedValue(createdReport);

      const res = await createReport(input);
      expect(mockReportCreate).toHaveBeenCalled();
      expect(res).toEqual(expect.objectContaining({ title: "Test Report" }));
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
        first_name: "Tech",
        last_name: "Nical",
      });
      mockReportUpdate.mockResolvedValue(
        createMockReportEntity({
          status: ReportStatus.ASSIGNED,
          assignedOfficerId: 99,
        })
      );

      const res = await approveReport(1, 2, 99);
      expect(mockReportUpdate).toHaveBeenCalledWith(1, {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 99,
      });
      expect(res.status).toBe(ReportStatus.ASSIGNED);
    });

    it("should throw NotFoundError if report not found after update (Edge case)", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(
        createMockReportEntity()
      );
      mockUserFindById.mockResolvedValue({
        id: 99,
        role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
      });
      mockReportUpdate.mockResolvedValue(null); // Simulate DB failure

      await expect(approveReport(1, 2, 99)).rejects.toThrow(NotFoundError);
    });
  });

  // --- 5. Reject Report ---
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

    it("should reject successfully", async () => {
      const report = createMockReportEntity();
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue({
        ...report,
        status: ReportStatus.REJECTED,
        rejectedReason: "Bad quality",
      });

      const res = await rejectReport(1, 99, "Bad quality");

      expect(mockReportUpdate).toHaveBeenCalledWith(1, {
        status: ReportStatus.REJECTED,
        rejectedReason: "Bad quality",
      });
      expect(res.status).toBe(ReportStatus.REJECTED);
      expect(res.rejectedReason).toBe("Bad quality");
    });

    it("should throw NotFoundError if report not found after update (Edge case)", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(
        createMockReportEntity()
      );
      mockReportUpdate.mockResolvedValue(null);
      await expect(rejectReport(1, 99, "Reason")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  // --- 6. Get Report By ID (Coverage for Lines 172-186 + DTO Complex types) ---
  describe("getReportById", () => {
    it("should return report if user is owner", async () => {
      const report = createMockReportEntity({ userId: 123 });
      mockReportFindByIdWithRelations.mockResolvedValue(report);

      const res = await getReportById(1, 123);
      expect(res.id).toBe(1);
    });

    it("should return report if user is assigned technical", async () => {
      const report = createMockReportEntity({
        userId: 999,
        assignedOfficerId: 50,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);

      const res = await getReportById(1, 50);
      expect(res.id).toBe(1);
    });

    it("should throw ForbiddenError if user is neither owner nor assigned", async () => {
      const report = createMockReportEntity({
        userId: 999,
        assignedOfficerId: 50,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);

      await expect(getReportById(1, 77)).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if report does not exist", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(null);
      await expect(getReportById(1, 1)).rejects.toThrow(NotFoundError);
    });

    // TEST FOR ReportDTO lines 77-92 (External Maintainer / Company)
    it("should map external maintainer with company correctly in DTO", async () => {
      const complexReport = createMockReportEntity({
        userId: 1,
        externalMaintainer: {
          id: 500,
          first_name: "Ext",
          last_name: "User",
          email: "ext@co.com",
          role: "EXTERNAL_MAINTAINER",
          externalCompany: {
            id: 10,
            name: "FixItAll",
            categories: ["WASTE"],
            platformAccess: true,
          },
        },
      });
      mockReportFindByIdWithRelations.mockResolvedValue(complexReport);

      const res = await getReportById(1, 1);
      
      expect(res.externalHandler).toBeDefined();
      expect(res.externalHandler?.type).toBe("user");
      // @ts-ignore
      expect(res.externalHandler?.user.company.name).toBe("FixItAll");
    });

    // TEST FOR ReportDTO lines 77-92 (External Company only)
    it("should map external company only correctly in DTO", async () => {
      const complexReport = createMockReportEntity({
        userId: 1,
        externalCompany: {
          id: 20,
          name: "CityWorks",
          categories: ["ROADS"],
          platformAccess: false,
        },
      });
      mockReportFindByIdWithRelations.mockResolvedValue(complexReport);

      const res = await getReportById(1, 1);

      expect(res.externalHandler).toBeDefined();
      expect(res.externalHandler?.type).toBe("company");
      // @ts-ignore
      expect(res.externalHandler?.company.name).toBe("CityWorks");
    });
  });

  // --- 7. Get Assigned Reports Services ---
  describe("getAssignedReportsService", () => {
    it("should fetch assigned reports with status filter", async () => {
      mockReportFindAssignedToUser.mockResolvedValue([]);
      await getAssignedReportsService(1, ReportStatus.IN_PROGRESS);
      expect(mockReportFindAssignedToUser).toHaveBeenCalledWith(1, [
        ReportStatus.IN_PROGRESS,
      ]);
    });

    it("should fetch assigned reports with default filter if status invalid/missing", async () => {
      mockReportFindAssignedToUser.mockResolvedValue([]);
      await getAssignedReportsService(1, undefined);
      // Expect default list of statuses
      expect(mockReportFindAssignedToUser).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          ReportStatus.ASSIGNED,
          ReportStatus.EXTERNAL_ASSIGNED,
          ReportStatus.IN_PROGRESS,
          ReportStatus.RESOLVED,
        ])
      );
    });
  });

  describe("getAssignedReportsForExternalMaintainer", () => {
    it("should fetch assigned reports for external with status filter", async () => {
      mockReportFindAssignedToExternalMaintainer.mockResolvedValue([]);
      await getAssignedReportsForExternalMaintainer(
        1,
        ReportStatus.IN_PROGRESS
      );
      expect(mockReportFindAssignedToExternalMaintainer).toHaveBeenCalledWith(
        1,
        [ReportStatus.IN_PROGRESS]
      );
    });

    it("should fetch with default filter if status invalid", async () => {
      mockReportFindAssignedToExternalMaintainer.mockResolvedValue([]);
      await getAssignedReportsForExternalMaintainer(1, "INVALID_STATUS");
      expect(mockReportFindAssignedToExternalMaintainer).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          ReportStatus.EXTERNAL_ASSIGNED,
          ReportStatus.IN_PROGRESS,
          ReportStatus.RESOLVED,
        ])
      );
    });
  });

  // --- 8. Update Report Status 
  describe("updateReportStatus", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportFindByIdWithRelations.mockResolvedValue(null);
      await expect(
        updateReportStatus(1, 1, ReportStatus.IN_PROGRESS)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if user is not assigned officer nor external maintainer", async () => {
      const report = createMockReportEntity({
        assignedOfficerId: 50,
        externalMaintainerId: 60,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);

      // User 99 tries to update
      await expect(
        updateReportStatus(1, 99, ReportStatus.IN_PROGRESS)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should update status successfully if user is assigned officer", async () => {
      const report = createMockReportEntity({
        assignedOfficerId: 50,
        status: ReportStatus.ASSIGNED,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue({
        ...report,
        status: ReportStatus.IN_PROGRESS,
      });

      const res = await updateReportStatus(1, 50, ReportStatus.IN_PROGRESS);

      expect(mockReportUpdate).toHaveBeenCalledWith(1, {
        status: ReportStatus.IN_PROGRESS,
      });
      expect(res.status).toBe(ReportStatus.IN_PROGRESS);
    });

    it("should update status successfully if user is external maintainer", async () => {
      const report = createMockReportEntity({
        externalMaintainerId: 60,
        status: ReportStatus.EXTERNAL_ASSIGNED,
      });
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue({
        ...report,
        status: ReportStatus.IN_PROGRESS,
      });

      const res = await updateReportStatus(1, 60, ReportStatus.IN_PROGRESS);

      expect(res.status).toBe(ReportStatus.IN_PROGRESS);
    });

    it("should throw NotFoundError if report not found after update", async () => {
      const report = createMockReportEntity({ assignedOfficerId: 50 });
      mockReportFindByIdWithRelations.mockResolvedValue(report);
      mockReportUpdate.mockResolvedValue(null);

      await expect(
        updateReportStatus(1, 50, ReportStatus.RESOLVED)
      ).rejects.toThrow(NotFoundError);
    });
  });
});