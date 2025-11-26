import {
  createReport,
  getApprovedReports,
  getPendingReports,
  approveReport,
  rejectReport,
  getAssignableTechnicalsForReport,
  TechnicalType,
} from "../../../src/services/reportService";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
} from "../../../src/utils/errors";
import { prisma } from "../../../src/utils/prismaClient";

// Mock the prisma client utility directly
jest.mock("../../../src/utils/prismaClient", () => ({
  prisma: {
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Access the mocks via the imported object
const mockCreate = prisma.report.create as jest.Mock;
const mockFindManyReport = prisma.report.findMany as jest.Mock;
const mockFindUniqueReport = prisma.report.findUnique as jest.Mock;
const mockUpdate = prisma.report.update as jest.Mock;
const mockFindManyUser = prisma.user.findMany as jest.Mock;
const mockFindUniqueUser = prisma.user.findUnique as jest.Mock;

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
      
      mockCreate.mockResolvedValue({ 
        id: 1, 
        ...input,
        user: { id: 1 },
        photos: [],
        messages: [] 
      });

      const res = await createReport(input);
      expect(mockCreate).toHaveBeenCalled();
      expect(res).toEqual(expect.objectContaining({ title: "T" }));
    });
  });

  describe("getApprovedReports", () => {
    it("should filter by category if provided", async () => {
      mockFindManyReport.mockResolvedValue([]);
      await getApprovedReports(ReportCategory.WASTE);
      expect(mockFindManyReport).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: ReportCategory.WASTE }),
        })
      );
    });
  });

  describe("getPendingReports", () => {
    it("should fetch pending reports", async () => {
      mockFindManyReport.mockResolvedValue([]);
      await getPendingReports();
      expect(mockFindManyReport).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.PENDING_APPROVAL },
        })
      );
    });
  });

  describe("getAssignableTechnicalsForReport", () => {
    it("should throw NotFoundError if report missing", async () => {
      mockFindUniqueReport.mockResolvedValue(null);
      await expect(getAssignableTechnicalsForReport(1)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should return technicals based on category mapping", async () => {
      mockFindUniqueReport.mockReturnValueOnce({
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
      });

      const mockTechnicals = [{ id: 10, role: "LOCAL_PUBLIC_SERVICES" }];
      mockFindManyUser.mockResolvedValue(mockTechnicals);

      const res = await getAssignableTechnicalsForReport(1);

      expect(mockFindManyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: {
              in: expect.arrayContaining([
                TechnicalType.LOCAL_PUBLIC_SERVICES,
                TechnicalType.INFRASTRUCTURES,
              ]),
            },
          },
        })
      );
      expect(res).toEqual(mockTechnicals);
    });

    it("should handle default/empty mapping if category unknown", async () => {
      mockFindUniqueReport.mockReturnValueOnce({
        id: 1,
        category: "UNKNOWN" as any,
      });
      mockFindManyUser.mockResolvedValue([]);
      await getAssignableTechnicalsForReport(1);
      expect(mockFindManyUser).toHaveBeenCalled();
    });
  });

  describe("approveReport", () => {
    it("should throw NotFoundError if report not found", async () => {
      mockFindUniqueReport.mockResolvedValue(null);
      await expect(approveReport(1, 2, 3)).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if not pending", async () => {
      mockFindUniqueReport.mockResolvedValue({
        id: 1,
        status: ReportStatus.ASSIGNED,
      });
      await expect(approveReport(1, 2, 3)).rejects.toThrow(BadRequestError);
    });

    it("should throw UnprocessableEntityError if technical not found", async () => {
      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.OTHER,
      });
      mockFindUniqueUser.mockResolvedValueOnce(null);

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw UnprocessableEntityError if technical role invalid for category", async () => {
      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
      });
      mockFindUniqueUser.mockResolvedValueOnce({
        id: 99,
        role: TechnicalType.WASTE_MANAGEMENT,
      });

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw NotFoundError if report not found AFTER update", async () => {
      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.OTHER,
      });
      mockFindUniqueUser.mockResolvedValueOnce({
        id: 99,
        role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
      });
      mockUpdate.mockResolvedValue({});
      mockFindUniqueReport.mockResolvedValueOnce(null);

      await expect(approveReport(1, 2, 99)).rejects.toThrow(
        "Report not found after update"
      );
    });

    it("should successfully approve and load assigned technical", async () => {
      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.OTHER,
      });
      mockFindUniqueUser.mockResolvedValueOnce({
        id: 99,
        role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
      });
      mockUpdate.mockResolvedValue({});

      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        assignedToId: 99,
        status: ReportStatus.ASSIGNED,
        user: { id: 1 },
        photos: [],
        messages: []
      });
      mockFindUniqueUser.mockResolvedValueOnce({
        id: 99,
        email: "tech@test.com",
        email_notifications_enabled: true
      });

      const res = await approveReport(1, 2, 99);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: ReportStatus.ASSIGNED,
            assignedToId: 99,
          }),
        })
      );
      // CORRECTION: Use objectContaining to match only the relevant fields
      expect(res.assignedTo).toEqual(
        expect.objectContaining({ id: 99, email: "tech@test.com" })
      );
    });

    it("should handle null assignedTo user after update", async () => {
      mockFindUniqueReport.mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.OTHER,
      });
      mockFindUniqueUser.mockResolvedValueOnce({
        id: 99,
        role: TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
      });
      mockUpdate.mockResolvedValue({});

      mockFindUniqueReport.mockResolvedValueOnce({ 
        id: 1, 
        assignedToId: 99,
        user: { id: 1 },
        photos: [],
        messages: []
      });
      mockFindUniqueUser.mockResolvedValueOnce(null);

      const res = await approveReport(1, 2, 99);
      expect(res.assignedTo).toBeNull();
    });
  });

  describe("rejectReport", () => {
    it("should validate reason length", async () => {
      await expect(rejectReport(1, 1, "")).rejects.toThrow(BadRequestError);
      await expect(rejectReport(1, 1, "a".repeat(501))).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it("should throw NotFound if report missing", async () => {
      mockFindUniqueReport.mockResolvedValue(null);
      await expect(rejectReport(1, 1, "Reason")).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequest if not pending", async () => {
      mockFindUniqueReport.mockResolvedValue({ status: ReportStatus.ASSIGNED });
      await expect(rejectReport(1, 1, "Reason")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should update status to REJECTED", async () => {
      mockFindUniqueReport.mockResolvedValue({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
      });
      
      mockUpdate.mockResolvedValue({ 
        id: 1, 
        status: ReportStatus.REJECTED,
        user: { id: 1 },
        photos: [],
        messages: []
      });

      await rejectReport(1, 1, "Reason");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ReportStatus.REJECTED,
            rejectedReason: "Reason",
          }),
        })
      );
    });
  });
});