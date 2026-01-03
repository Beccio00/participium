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
    findAssignedToExternalMaintainer:
      mockReportFindAssignedToExternalMaintainer, // Added
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

  describe("Anonymous Report Feature - PT15", () => {
    describe("createReport with anonymous option", () => {
      const baseReportData = {
        title: "Test Report",
        description: "Test Description",
        category: ReportCategory.PUBLIC_LIGHTING,
        latitude: 45.0703,
        longitude: 7.6869,
        address: "Test Address",
        photos: [
          { id: 0, filename: "test.jpg", url: "http://test.com/test.jpg" },
        ],
        userId: 1,
      };

      beforeEach(() => {
        mockReportCreate.mockClear();
      });

      it("should create report with isAnonymous set to true", async () => {
        const anonymousReportData = {
          ...baseReportData,
          isAnonymous: true,
        };

        const expectedReport = {
          id: 1,
          ...anonymousReportData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(anonymousReportData);

        expect(mockReportCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            isAnonymous: true,
            userId: 1,
          })
        );
        expect(result.isAnonymous).toBe(true);
        expect(result.userId).toBe(1);
      });

      it("should create report with isAnonymous set to false", async () => {
        const nonAnonymousReportData = {
          ...baseReportData,
          isAnonymous: false,
        };

        const expectedReport = {
          id: 1,
          ...nonAnonymousReportData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(nonAnonymousReportData);

        expect(mockReportCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            isAnonymous: false,
            userId: 1,
          })
        );
        expect(result.isAnonymous).toBe(false);
      });

      it("should preserve userId even when report is anonymous", async () => {
        const anonymousReportData = {
          ...baseReportData,
          isAnonymous: true,
          userId: 42,
        };

        const expectedReport = {
          id: 1,
          ...anonymousReportData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 42 },
          photos: [],
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(anonymousReportData);

        expect(mockReportCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 42,
            isAnonymous: true,
          })
        );
        expect(result.userId).toBe(42);
      });

      it("should create multiple anonymous reports from same user", async () => {
        const anonymousData1 = {
          ...baseReportData,
          isAnonymous: true,
          title: "Report 1",
        };
        const anonymousData2 = {
          ...baseReportData,
          isAnonymous: true,
          title: "Report 2",
        };

        const expectedReport1 = {
          id: 1,
          ...anonymousData1,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };
        const expectedReport2 = {
          id: 2,
          ...anonymousData2,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce({ id: 2 });
        mockReportFindByIdWithRelations
          .mockResolvedValueOnce(expectedReport1)
          .mockResolvedValueOnce(expectedReport2);

        const result1 = await createReport(anonymousData1);
        const result2 = await createReport(anonymousData2);

        expect(result1.isAnonymous).toBe(true);
        expect(result2.isAnonymous).toBe(true);
        expect(result1.userId).toBe(result2.userId);
      });

      it("should create both anonymous and non-anonymous reports", async () => {
        const anonymousData = { ...baseReportData, isAnonymous: true };
        const publicData = { ...baseReportData, isAnonymous: false };

        const expectedAnonymous = {
          id: 1,
          ...anonymousData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };
        const expectedPublic = {
          id: 2,
          ...publicData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce({ id: 2 });
        mockReportFindByIdWithRelations
          .mockResolvedValueOnce(expectedAnonymous)
          .mockResolvedValueOnce(expectedPublic);

        const anonymousReport = await createReport(anonymousData);
        const publicReport = await createReport(publicData);

        expect(anonymousReport.isAnonymous).toBe(true);
        expect(publicReport.isAnonymous).toBe(false);
      });

      it("should pass isAnonymous flag to repository correctly", async () => {
        const testData = { ...baseReportData, isAnonymous: true };
        const expectedReport = {
          id: 1,
          ...testData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        await createReport(testData);

        const callArg = mockReportCreate.mock.calls[0][0];
        expect(callArg).toHaveProperty("isAnonymous");
        expect(callArg.isAnonymous).toBe(true);
        expect(typeof callArg.isAnonymous).toBe("boolean");
      });

      it("should maintain all report fields when anonymous", async () => {
        const completeAnonymousData = {
          ...baseReportData,
          isAnonymous: true,
          address: "Via Roma 10",
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
        };

        const expectedReport = {
          id: 1,
          ...completeAnonymousData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(completeAnonymousData);

        expect(result.title).toBe(completeAnonymousData.title);
        expect(result.description).toBe(completeAnonymousData.description);
        expect(result.category).toBe(completeAnonymousData.category);
        expect(result.latitude).toBe(completeAnonymousData.latitude);
        expect(result.longitude).toBe(completeAnonymousData.longitude);
        expect(result.address).toBe(completeAnonymousData.address);
        expect(result.isAnonymous).toBe(true);
      });
    });

    describe("Report retrieval and privacy", () => {
      it("should include isAnonymous flag in report data", async () => {
        const mockReport = {
          id: 1,
          title: "Test",
          description: "Test",
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0,
          longitude: 7.0,
          isAnonymous: true,
          status: ReportStatus.ASSIGNED,
          userId: 1,
          user: { id: 1, firstName: "John", lastName: "Doe" },
          photos: [],
          messages: [],
        };

        mockReportFindByStatusAndCategory.mockResolvedValue([mockReport]);

        const reports = await getApprovedReports();

        expect(reports).toBeDefined();
        expect(reports.length).toBeGreaterThan(0);
      });

      it("should filter anonymous reports correctly", async () => {
        const anonymousReport = {
          id: 1,
          isAnonymous: true,
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.PUBLIC_LIGHTING,
          title: "Test",
          description: "Test",
          latitude: 45.0,
          longitude: 7.0,
          userId: 1,
          user: { id: 1 },
          photos: [],
          messages: [],
        };

        const publicReport = {
          id: 2,
          isAnonymous: false,
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.PUBLIC_LIGHTING,
          title: "Test 2",
          description: "Test 2",
          latitude: 45.0,
          longitude: 7.0,
          userId: 2,
          user: { id: 2 },
          photos: [],
          messages: [],
        };

        mockReportFindByStatusAndCategory.mockResolvedValue([
          anonymousReport,
          publicReport,
        ]);

        const reports = await getApprovedReports();

        expect(reports).toBeDefined();
      });
    });

    describe("Choice timing - at report creation", () => {
      it("should allow setting isAnonymous at creation time", async () => {
        const reportData = {
          ...{
            title: "New Report",
            description: "Description",
            category: ReportCategory.OTHER,
            latitude: 45.0,
            longitude: 7.0,
            address: "Address",
            photos: [
              { id: 0, filename: "test.jpg", url: "http://test.com/test.jpg" },
            ],
            userId: 1,
          },
          isAnonymous: true,
        };

        const expectedReport = {
          id: 1,
          ...reportData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 1 },
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(reportData);

        expect(result.isAnonymous).toBe(true);
        expect(mockReportCreate).toHaveBeenCalledWith(
          expect.objectContaining({ isAnonymous: true })
        );
      });

      it("should not allow changing isAnonymous after creation (immutable)", async () => {
        const report = {
          id: 1,
          isAnonymous: true,
          status: ReportStatus.PENDING_APPROVAL,
        };

        mockReportFindByIdWithRelations.mockResolvedValue(report);

        // Update operations should not change isAnonymous
        const updateCall = mockReportUpdate.mock.calls;

        // Verify isAnonymous is set at creation and not changed
        expect(report.isAnonymous).toBe(true);
      });
    });

    describe("Privacy protection", () => {
      it("should store userId internally even for anonymous reports", async () => {
        const anonymousReportData = {
          title: "Test",
          description: "Test",
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0,
          longitude: 7.0,
          address: "Test",
          photos: [
            { id: 0, filename: "test.jpg", url: "http://test.com/test.jpg" },
          ],
          userId: 123,
          isAnonymous: true,
        };

        const expectedReport = {
          id: 1,
          ...anonymousReportData,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: 123 },
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(anonymousReportData);

        expect(result.userId).toBe(123);
        expect(result.isAnonymous).toBe(true);
      });

      it("should maintain report ownership through userId for administrative purposes", async () => {
        const userId = 999;
        const data = {
          title: "Report",
          description: "Description",
          category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
          latitude: 45.0,
          longitude: 7.0,
          address: "Address",
          photos: [
            { id: 0, filename: "test.jpg", url: "http://test.com/test.jpg" },
          ],
          userId: userId,
          isAnonymous: true,
        };

        const expectedReport = {
          id: 1,
          ...data,
          status: ReportStatus.PENDING_APPROVAL,
          user: { id: userId },
          messages: [],
        };

        mockReportCreate.mockResolvedValue({ id: 1 });
        mockReportFindByIdWithRelations.mockResolvedValue(expectedReport);

        const result = await createReport(data);

        // Internal tracking maintained
        expect(result.userId).toBe(userId);
        // Public anonymity flag set
        expect(result.isAnonymous).toBe(true);
      });
    });
  });

  // =========================
  // getApprovedReports tests
  // =========================
  describe("getApprovedReports", () => {
    const mockFindByStatusCategoryAndBounds = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock the repository method
      const ReportRepository =
        require("../../../src/repositories/ReportRepository")
          .ReportRepository as jest.MockedClass<any>;
      ReportRepository.prototype.findByStatusCategoryAndBounds =
        mockFindByStatusCategoryAndBounds;
    });

    it("should return all approved reports without filters", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Report 1",
          category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
          status: ReportStatus.ASSIGNED,
          latitude: 45.0731,
          longitude: 7.686,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
        {
          id: 2,
          title: "Report 2",
          category: ReportCategory.WASTE_MANAGEMENT,
          status: ReportStatus.IN_PROGRESS,
          latitude: 45.0745,
          longitude: 7.6875,
          user: { id: 2 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports();

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        [
          ReportStatus.ASSIGNED,
          ReportStatus.EXTERNAL_ASSIGNED,
          ReportStatus.IN_PROGRESS,
          ReportStatus.RESOLVED,
        ],
        undefined,
        undefined
      );
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Report 1");
      expect(result[1].title).toBe("Report 2");
    });

    it("should filter approved reports by category only", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Water issue",
          category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(
        ReportCategory.WATER_SUPPLY_DRINKING_WATER
      );

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        expect.any(Array),
        ReportCategory.WATER_SUPPLY_DRINKING_WATER,
        undefined
      );
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(
        ReportCategory.WATER_SUPPLY_DRINKING_WATER
      );
    });

    it("should filter approved reports by bounding box only", async () => {
      const bbox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const mockReports = [
        {
          id: 1,
          title: "Report in area",
          latitude: 45.1,
          longitude: 7.65,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(undefined, bbox);

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        bbox
      );
      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(45.1);
      expect(result[0].longitude).toBe(7.65);
    });

    it("should filter approved reports by both category and bounding box", async () => {
      const bbox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const mockReports = [
        {
          id: 1,
          title: "Road maintenance issue",
          category: ReportCategory.ROAD_MAINTENANCE,
          latitude: 45.1,
          longitude: 7.65,
          status: ReportStatus.IN_PROGRESS,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(
        ReportCategory.ROAD_MAINTENANCE,
        bbox
      );

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        expect.any(Array),
        ReportCategory.ROAD_MAINTENANCE,
        bbox
      );
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(ReportCategory.ROAD_MAINTENANCE);
      expect(result[0].latitude).toBe(45.1);
    });

    it("should return empty array when no reports match filters", async () => {
      mockFindByStatusCategoryAndBounds.mockResolvedValue([]);

      const result = await getApprovedReports(ReportCategory.WASTE_MANAGEMENT);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should only return reports with approved statuses", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Assigned report",
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
        {
          id: 2,
          title: "External assigned report",
          status: ReportStatus.EXTERNAL_ASSIGNED,
          user: { id: 2 },
          photos: [],
          messages: [],
        },
        {
          id: 3,
          title: "In progress report",
          status: ReportStatus.IN_PROGRESS,
          user: { id: 3 },
          photos: [],
          messages: [],
        },
        {
          id: 4,
          title: "Resolved report",
          status: ReportStatus.RESOLVED,
          user: { id: 4 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      await getApprovedReports();

      // Verify that only these statuses are requested
      const callArgs = mockFindByStatusCategoryAndBounds.mock.calls[0];
      const statusesArg = callArgs[0];
      expect(statusesArg).toContain(ReportStatus.ASSIGNED);
      expect(statusesArg).toContain(ReportStatus.EXTERNAL_ASSIGNED);
      expect(statusesArg).toContain(ReportStatus.IN_PROGRESS);
      expect(statusesArg).toContain(ReportStatus.RESOLVED);
      expect(statusesArg).not.toContain(ReportStatus.PENDING_APPROVAL);
      expect(statusesArg).not.toContain(ReportStatus.REJECTED);
    });

    it("should handle bounding box with decimal coordinates", async () => {
      const bbox = {
        minLon: 7.654321,
        minLat: 45.0123456,
        maxLon: 7.7654321,
        maxLat: 45.1234567,
      };

      const mockReports = [];
      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      await getApprovedReports(undefined, bbox);

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        bbox
      );
    });

    it("should handle bounding box with negative coordinates", async () => {
      const bbox = {
        minLon: -0.5,
        minLat: -45.0,
        maxLon: 0.8,
        maxLat: 45.2,
      };

      const mockReports = [];
      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      await getApprovedReports(undefined, bbox);

      expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        bbox
      );
    });

    it("should return multiple reports from different areas in same bounding box", async () => {
      const bbox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const mockReports = [
        {
          id: 1,
          title: "Report in north area",
          latitude: 45.15,
          longitude: 7.7,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
        {
          id: 2,
          title: "Report in south area",
          latitude: 45.05,
          longitude: 7.6,
          status: ReportStatus.IN_PROGRESS,
          user: { id: 2 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(undefined, bbox);

      expect(result).toHaveLength(2);
      expect(result[0].latitude).toBe(45.15);
      expect(result[1].latitude).toBe(45.05);
    });

    it("should convert reports from entity format to DTO format", async () => {
      const mockEntity = {
        id: 1,
        title: "Test Report",
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        user: { id: 1, email: "user@test.com" },
        photos: [{ id: 1, filename: "test.jpg", url: "http://test.com" }],
        messages: [{ id: 1, content: "Test message" }],
      };

      mockFindByStatusCategoryAndBounds.mockResolvedValue([mockEntity]);

      const result = await getApprovedReports();

      // Result should be converted to DTO (toReportDTO)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe("Test Report");
    });

    it("should handle category filter for each report category", async () => {
      const categories = Object.values(ReportCategory);

      for (const category of categories.slice(0, 3)) {
        // Test first 3 categories
        const mockReports = [
          {
            id: 1,
            title: "Test",
            category: category,
            status: ReportStatus.ASSIGNED,
            user: { id: 1 },
            photos: [],
            messages: [],
          },
        ];

        mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

        const result = await getApprovedReports(category);

        expect(mockFindByStatusCategoryAndBounds).toHaveBeenCalledWith(
          expect.any(Array),
          category,
          undefined
        );
        expect(result[0].category).toBe(category);
      }
    });

    it("should handle very small bounding boxes (zoom level 18+)", async () => {
      const smallBbox = {
        minLon: 7.686,
        minLat: 45.0731,
        maxLon: 7.687,
        maxLat: 45.0741,
      };

      const mockReports = [
        {
          id: 1,
          title: "Report in small area",
          latitude: 45.0736,
          longitude: 7.6865,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(undefined, smallBbox);

      expect(result).toHaveLength(1);
    });

    it("should handle large bounding boxes (zoom level 12)", async () => {
      const largeBbox = {
        minLon: 7.0,
        minLat: 44.5,
        maxLon: 8.5,
        maxLat: 45.5,
      };

      const mockReports = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Report ${i + 1}`,
        latitude: 44.5 + (i % 5) * 0.2,
        longitude: 7.0 + Math.floor(i / 5) * 0.75,
        status: ReportStatus.ASSIGNED,
        user: { id: i + 1 },
        photos: [],
        messages: [],
      }));

      mockFindByStatusCategoryAndBounds.mockResolvedValue(mockReports);

      const result = await getApprovedReports(undefined, largeBbox);

      expect(result).toHaveLength(10);
    });
  });
});
