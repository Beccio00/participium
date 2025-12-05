import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
  ForbiddenError,
} from "../../../src/utils/errors";

// 1. Define the mock objects FIRST
const mockReportRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdWithRelations: jest.fn(),
  findAssignedToUser: jest.fn(),
  findAssignedToExternalMaintainer: jest.fn(),
  findByStatusAndCategory: jest.fn(),
  findByStatus: jest.fn(),
  update: jest.fn(),
};

const mockUserRepo = {
  findById: jest.fn(),
  findByRoles: jest.fn(),
};

const mockReportMessageRepo = {
  create: jest.fn(),
  findByReportId: jest.fn(),
};

const mockReportPhotoRepo = {
  createMany: jest.fn(),
};

// 2. Mock the repositories using the variables defined above
// NOTE: These factories will only run when the service is imported (in beforeAll)
jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => mockReportRepo),
}));
jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => mockUserRepo),
}));
jest.mock("../../../src/repositories/ReportMessageRepository", () => ({
  ReportMessageRepository: jest.fn().mockImplementation(() => mockReportMessageRepo),
}));
jest.mock("../../../src/repositories/ReportPhotoRepository", () => ({
  ReportPhotoRepository: jest.fn().mockImplementation(() => mockReportPhotoRepo),
}));

// 3. Mock the Notification Service
jest.mock("../../../src/services/notificationService", () => ({
  notifyReportStatusChange: jest.fn(),
  notifyNewMessage: jest.fn(),
  notifyReportAssigned: jest.fn(),
  notifyReportApproved: jest.fn(),
  notifyReportRejected: jest.fn(),
}));

// 4. Define TechnicalType locally for tests
enum TechnicalType {
  CULTURE_EVENTS_TOURISM_SPORTS = "CULTURE_EVENTS_TOURISM_SPORTS",
  LOCAL_PUBLIC_SERVICES = "LOCAL_PUBLIC_SERVICES",
  EDUCATION_SERVICES = "EDUCATION_SERVICES",
  PUBLIC_RESIDENTIAL_HOUSING = "PUBLIC_RESIDENTIAL_HOUSING",
  INFORMATION_SYSTEMS = "INFORMATION_SYSTEMS",
  MUNICIPAL_BUILDING_MAINTENANCE = "MUNICIPAL_BUILDING_MAINTENANCE",
  PRIVATE_BUILDINGS = "PRIVATE_BUILDINGS",
  INFRASTRUCTURES = "INFRASTRUCTURES",
  GREENSPACES_AND_ANIMAL_PROTECTION = "GREENSPACES_AND_ANIMAL_PROTECTION",
  WASTE_MANAGEMENT = "WASTE_MANAGEMENT",
  ROAD_MAINTENANCE = "ROAD_MAINTENANCE",
  CIVIL_PROTECTION = "CIVIL_PROTECTION",
  EXTERNAL_MAINTAINER = "EXTERNAL_MAINTAINER"
}

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

      mockReportRepo.create.mockResolvedValue({ id: 1 });
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());

      const res = await reportService.createReport(input);

      expect(mockReportRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        title: "T",
        userId: 1
      }));
      expect(mockReportPhotoRepo.createMany).toHaveBeenCalled();
      expect(res).toHaveProperty("id", 1);
    });

    it("should handle creation without photos", async () => {
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

      mockReportRepo.create.mockResolvedValue({ id: 1 });
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());

      await reportService.createReport(input);
      expect(mockReportPhotoRepo.createMany).not.toHaveBeenCalled();
    });
  });

  // --- 2. Get Lists ---
  describe("getApprovedReports", () => {
    it("should return approved reports filtered by category", async () => {
      mockReportRepo.findByStatusAndCategory.mockResolvedValue([createMockReportEntity()]);
      const res = await reportService.getApprovedReports(ReportCategory.WASTE);
      
      expect(mockReportRepo.findByStatusAndCategory).toHaveBeenCalledWith(
        expect.arrayContaining([ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED]),
        ReportCategory.WASTE
      );
      expect(res).toHaveLength(1);
    });
  });

  describe("getPendingReports", () => {
    it("should return pending reports", async () => {
      mockReportRepo.findByStatus.mockResolvedValue([createMockReportEntity()]);
      await reportService.getPendingReports();
      expect(mockReportRepo.findByStatus).toHaveBeenCalledWith([ReportStatus.PENDING_APPROVAL]);
    });
  });

  describe("getAssignedReportsService", () => {
    it("should return reports assigned to technical with default filters", async () => {
      mockReportRepo.findAssignedToUser.mockResolvedValue([createMockReportEntity()]);
      await reportService.getAssignedReportsService(99);
      expect(mockReportRepo.findAssignedToUser).toHaveBeenCalledWith(99, expect.any(Array));
    });

    it("should apply specific status filter if valid", async () => {
      mockReportRepo.findAssignedToUser.mockResolvedValue([]);
      await reportService.getAssignedReportsService(99, ReportStatus.RESOLVED);
      expect(mockReportRepo.findAssignedToUser).toHaveBeenCalledWith(99, [ReportStatus.RESOLVED]);
    });

    it("should ignore invalid status filter", async () => {
      mockReportRepo.findAssignedToUser.mockResolvedValue([]);
      await reportService.getAssignedReportsService(99, "INVALID_STATUS");
      expect(mockReportRepo.findAssignedToUser).toHaveBeenCalledWith(99, expect.arrayContaining([ReportStatus.ASSIGNED]));
    });
  });

  describe("getAssignedReportsForExternalMaintainer", () => {
    it("should return external reports with defaults", async () => {
      mockReportRepo.findAssignedToExternalMaintainer.mockResolvedValue([]);
      await reportService.getAssignedReportsForExternalMaintainer(88);
      expect(mockReportRepo.findAssignedToExternalMaintainer).toHaveBeenCalledWith(88, expect.any(Array));
    });

    it("should apply valid status filter", async () => {
      mockReportRepo.findAssignedToExternalMaintainer.mockResolvedValue([]);
      await reportService.getAssignedReportsForExternalMaintainer(88, ReportStatus.IN_PROGRESS);
      expect(mockReportRepo.findAssignedToExternalMaintainer).toHaveBeenCalledWith(88, [ReportStatus.IN_PROGRESS]);
    });
  });

  // --- 3. Get Assignable Technicals ---
  describe("getAssignableTechnicalsForReport", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findById.mockResolvedValue(null);
      await expect(reportService.getAssignableTechnicalsForReport(1)).rejects.toThrow(NotFoundError);
    });

    it("should find technicals based on category mapping", async () => {
      mockReportRepo.findById.mockResolvedValue({ id: 1, category: ReportCategory.WATER_SUPPLY_DRINKING_WATER });
      
      const mockTechs = [{ id: 10, role: TechnicalType.LOCAL_PUBLIC_SERVICES }];
      mockUserRepo.findByRoles.mockResolvedValue(mockTechs);

      const res = await reportService.getAssignableTechnicalsForReport(1);

      expect(mockUserRepo.findByRoles).toHaveBeenCalledWith(expect.arrayContaining([
        TechnicalType.LOCAL_PUBLIC_SERVICES,
        TechnicalType.INFRASTRUCTURES
      ]));
      expect(res).toEqual(mockTechs);
    });

    it("should handle unknown category (empty mapping)", async () => {
        mockReportRepo.findById.mockResolvedValue({ id: 1, category: "UNKNOWN_CAT" as any });
        mockUserRepo.findByRoles.mockResolvedValue([]);
        
        const res = await reportService.getAssignableTechnicalsForReport(1);
        expect(res).toEqual([]);
    });
  });

  // --- 4. Approve Report ---
  describe("approveReport", () => {
    it("should throw NotFoundError if report not found", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.approveReport(1, 2, 3)).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if report not PENDING", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ status: ReportStatus.ASSIGNED }));
      await expect(reportService.approveReport(1, 2, 3)).rejects.toThrow(BadRequestError);
    });

    it("should throw UnprocessableEntityError if technical not found", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(reportService.approveReport(1, 2, 99)).rejects.toThrow(UnprocessableEntityError);
    });

    it("should throw UnprocessableEntityError if technical has wrong role", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ category: ReportCategory.WATER_SUPPLY_DRINKING_WATER }));
      mockUserRepo.findById.mockResolvedValue({ id: 99, role: "WRONG_ROLE" });

      await expect(reportService.approveReport(1, 2, 99)).rejects.toThrow(UnprocessableEntityError);
    });

    it("should throw NotFoundError if update fails (returns null)", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());
        mockUserRepo.findById.mockResolvedValue({ id: 99, role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE }); 
        mockReportRepo.update.mockResolvedValue(null);
  
        await expect(reportService.approveReport(1, 2, 99)).rejects.toThrow("Report not found after update");
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

  // --- 5. Reject Report ---
  describe("rejectReport", () => {
    it("should validate reason (required)", async () => {
      await expect(reportService.rejectReport(1, 1, "")).rejects.toThrow(BadRequestError);
    });

    it("should validate reason length", async () => {
      const longReason = "a".repeat(501);
      await expect(reportService.rejectReport(1, 1, longReason)).rejects.toThrow(UnprocessableEntityError);
    });

    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.rejectReport(1, 1, "Reason")).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if not pending", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ status: ReportStatus.RESOLVED }));
      await expect(reportService.rejectReport(1, 1, "Reason")).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if update fails", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());
      mockReportRepo.update.mockResolvedValue(null);
      await expect(reportService.rejectReport(1, 1, "Reason")).rejects.toThrow("Report not found after update");
    });

    it("should succeed, create message, and notify", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity());
        mockReportRepo.update.mockResolvedValue(createMockReportEntity({ status: ReportStatus.REJECTED }));
        
        await reportService.rejectReport(1, 1, "Bad content");
        
        expect(mockReportMessageRepo.create).toHaveBeenCalled();
        expect(mockReportRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: ReportStatus.REJECTED }));
    });
  });

  // --- 6. Update Report Status (Technical) ---
  describe("updateReportStatus", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.updateReportStatus(1, 99, ReportStatus.IN_PROGRESS)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if user not assigned", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ assignedOfficerId: 50 }));
      await expect(reportService.updateReportStatus(1, 99, ReportStatus.IN_PROGRESS)).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if update returns null", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ assignedOfficerId: 99 }));
        mockReportRepo.update.mockResolvedValue(null);
        await expect(reportService.updateReportStatus(1, 99, ReportStatus.IN_PROGRESS)).rejects.toThrow("Report not found after update");
    });

    it("should succeed and notify", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ assignedOfficerId: 99, status: ReportStatus.ASSIGNED }));
      mockReportRepo.update.mockResolvedValue(createMockReportEntity({ assignedOfficerId: 99, status: ReportStatus.IN_PROGRESS }));

      const res = await reportService.updateReportStatus(1, 99, ReportStatus.IN_PROGRESS);
      expect(res.status).toBe(ReportStatus.IN_PROGRESS);
    });
  });

  // --- 7. Send Message ---
  describe("sendMessageToCitizen", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.sendMessageToCitizen(1, 99, "Msg")).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if technical not assigned", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ assignedOfficerId: 50 }));
        await expect(reportService.sendMessageToCitizen(1, 99, "Msg")).rejects.toThrow(ForbiddenError);
    });

    it("should create message and return DTO", async () => {
        const report = createMockReportEntity({ 
            assignedOfficerId: 99, 
            assignedOfficer: { first_name: "T", last_name: "S" } 
        });
        mockReportRepo.findByIdWithRelations.mockResolvedValue(report);
        
        mockReportMessageRepo.create.mockResolvedValue({
            id: 100,
            content: "Msg",
            createdAt: mockDate,
            senderId: 99,
            user: { role: "TECHNICAL_STAFF" }
        });

        const res = await reportService.sendMessageToCitizen(1, 99, "Msg");
        expect(res.content).toBe("Msg");
        expect(mockReportMessageRepo.create).toHaveBeenCalled();
    });
  });

  // --- 8. Get Messages ---
  describe("getReportMessages", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.getReportMessages(1, 1)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if user is neither owner nor assigned technical", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ userId: 1, assignedOfficerId: 99 }));
        await expect(reportService.getReportMessages(1, 50)).rejects.toThrow(ForbiddenError);
    });

    it("should return messages for owner", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ userId: 1 }));
        mockReportMessageRepo.findByReportId.mockResolvedValue([
            { id: 1, content: "Hi", createdAt: mockDate, senderId: 1, user: { role: "CITIZEN" } }
        ]);
        const res = await reportService.getReportMessages(1, 1);
        expect(res).toHaveLength(1);
    });

    it("should return messages for assigned technical", async () => {
        mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ userId: 1, assignedOfficerId: 99 }));
        mockReportMessageRepo.findByReportId.mockResolvedValue([]);
        const res = await reportService.getReportMessages(1, 99);
        expect(res).toEqual([]);
    });
  });

  // --- 9. Get Report By ID ---
  describe("getReportById", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);
      await expect(reportService.getReportById(1, 1)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if user unauthorized", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ userId: 1, assignedOfficerId: 99 }));
      await expect(reportService.getReportById(1, 50)).rejects.toThrow(ForbiddenError);
    });

    it("should return report for owner", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(createMockReportEntity({ userId: 1 }));
      const res = await reportService.getReportById(1, 1);
      expect(res.id).toBe(1);
    });

    // --- NUOVO TEST PER LA BRANCH COVERAGE ---
    it("should return report for assigned technical", async () => {
      // User is 99 (Technical), Report owner is 1, Assigned to 99
      mockReportRepo.findByIdWithRelations.mockResolvedValue(
          createMockReportEntity({ userId: 1, assignedOfficerId: 99 })
      );
      const res = await reportService.getReportById(1, 99);
      expect(res.id).toBe(1);
    });
  });
});