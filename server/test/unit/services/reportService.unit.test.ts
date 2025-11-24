import {
  createReport,
  getApprovedReports,
} from "../../../src/services/reportService";
import { ReportCategory } from "../../../../shared/ReportTypes";

// Mock the Prisma client
const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock("../../../src/utils/prismaClient", () => ({
  prisma: {
    report: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

describe("reportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    const validReportData = {
      title: "Broken streetlight",
      description: "The streetlight on Via Roma is not working",
      category: "PUBLIC_LIGHTING" as ReportCategory,
      latitude: 45.0703,
      longitude: 7.6869,
      address: "Via Roma 123, Torino",
      isAnonymous: false,
      userId: 1,
      photos: [
        {
          id: 1,
          url: "https://example.com/photo.jpg",
          filename: "streetlight.jpg",
        },
      ],
    };

    it("should create a report with valid data", async () => {
      const mockCreatedReport = {
        id: 1,
        ...validReportData,
        status: "PENDING_APPROVAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
        },
        photos: [
          {
            id: 1,
            url: "https://example.com/photo.jpg",
            filename: "streetlight.jpg",
            reportId: 1,
          },
        ],
      };

      mockCreate.mockResolvedValue(mockCreatedReport);

      const result = await createReport(validReportData);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          address: null,
          title: validReportData.title,
          description: validReportData.description,
          category: validReportData.category,
          latitude: validReportData.latitude,
          longitude: validReportData.longitude,
          address: validReportData.address,
          isAnonymous: validReportData.isAnonymous,
          status: "PENDING_APPROVAL",
          userId: validReportData.userId,
          photos: {
            create: [
              {
                url: "https://example.com/photo.jpg",
                filename: "streetlight.jpg",
              },
            ],
          },
        },
        include: {
          user: true,
          photos: true,
        },
      });

      expect(result).toEqual(mockCreatedReport);
    });

    it("should create anonymous report", async () => {
      const anonymousReportData = {
        ...validReportData,
        isAnonymous: true,
      };

      const mockCreatedReport = {
        id: 1,
        ...anonymousReportData,
        status: "PENDING_APPROVAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
        },
        photos: [],
      };

      mockCreate.mockResolvedValue(mockCreatedReport);

      const result = await createReport(anonymousReportData);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          address: null,
          title: anonymousReportData.title,
          description: anonymousReportData.description,
          category: anonymousReportData.category,
          latitude: anonymousReportData.latitude,
          longitude: anonymousReportData.longitude,
          address: anonymousReportData.address,
          isAnonymous: true,
          status: "PENDING_APPROVAL",
          userId: anonymousReportData.userId,
          photos: {
            create: [
              {
                url: "https://example.com/photo.jpg",
                filename: "streetlight.jpg",
              },
            ],
          },
        },
        include: {
          user: true,
          photos: true,
        },
      });

      expect(result).toEqual(mockCreatedReport);
    });

    it("should create report with multiple photos", async () => {
      const reportWithMultiplePhotos = {
        ...validReportData,
        photos: [
          {
            id: 1,
            url: "https://example.com/photo1.jpg",
            filename: "photo1.jpg",
          },
          {
            id: 2,
            url: "https://example.com/photo2.jpg",
            filename: "photo2.jpg",
          },
        ],
      };

      const mockCreatedReport = {
        id: 1,
        ...reportWithMultiplePhotos,
        status: "PENDING_APPROVAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
        },
        photos: [
          {
            id: 1,
            url: "https://example.com/photo1.jpg",
            filename: "photo1.jpg",
            reportId: 1,
          },
          {
            id: 2,
            url: "https://example.com/photo2.jpg",
            filename: "photo2.jpg",
            reportId: 1,
          },
        ],
      };

      mockCreate.mockResolvedValue(mockCreatedReport);

      const result = await createReport(reportWithMultiplePhotos);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          address: null,
          title: reportWithMultiplePhotos.title,
          description: reportWithMultiplePhotos.description,
          category: reportWithMultiplePhotos.category,
          latitude: reportWithMultiplePhotos.latitude,
          longitude: reportWithMultiplePhotos.longitude,
          address: reportWithMultiplePhotos.address,
          isAnonymous: reportWithMultiplePhotos.isAnonymous,
          status: "PENDING_APPROVAL",
          userId: reportWithMultiplePhotos.userId,
          photos: {
            create: [
              {
                url: "https://example.com/photo1.jpg",
                filename: "photo1.jpg",
              },
              {
                url: "https://example.com/photo2.jpg",
                filename: "photo2.jpg",
              },
            ],
          },
        },
        include: {
          user: true,
          photos: true,
        },
      });

      expect(result).toEqual(mockCreatedReport);
    });

    it("should create report with Turin coordinates", async () => {
      const turinReportData = {
        ...validReportData,
        latitude: 45.0703,
        longitude: 7.6869,
      };

      const mockCreatedReport = {
        id: 1,
        ...turinReportData,
        status: "PENDING_APPROVAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1 },
        photos: [],
      };

      mockCreate.mockResolvedValue(mockCreatedReport);

      const result = await createReport(turinReportData);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: 45.0703,
            longitude: 7.6869,
          }),
        })
      );

      expect(result).toEqual(mockCreatedReport);
    });

    it("should create report with different categories", async () => {
      const categories = [
        "WATER_SUPPLY_DRINKING_WATER",
        "ARCHITECTURAL_BARRIERS",
        "SEWER_SYSTEM",
        "PUBLIC_LIGHTING",
        "WASTE",
        "ROAD_SIGNS_TRAFFIC_LIGHTS",
        "ROADS_URBAN_FURNISHINGS",
        "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
        "OTHER",
      ];

      for (const category of categories) {
        const reportWithCategory = {
          ...validReportData,
          category: category as any,
        };

        const mockCreatedReport = {
          id: 1,
          ...reportWithCategory,
          status: "PENDING_APPROVAL",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1 },
          photos: [],
        };

        mockCreate.mockResolvedValue(mockCreatedReport);

        await createReport(reportWithCategory);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              category: category,
            }),
          })
        );

        jest.clearAllMocks();
      }
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockCreate.mockRejectedValue(error);

      await expect(createReport(validReportData)).rejects.toThrow(error);

      expect(mockCreate).toHaveBeenCalled();
    });

    it("should create report with boundary coordinates", async () => {
      // Test coordinate ai limiti
      const boundaryTests = [
        { latitude: -90, longitude: -180 }, // Limite sud-ovest
        { latitude: 90, longitude: 180 }, // Limite nord-est
        { latitude: 0, longitude: 0 }, // Equatore e meridiano di Greenwich
        { latitude: 45.1, longitude: 7.7 }, // Coordinate vicino a Torino
      ];

      for (const coords of boundaryTests) {
        const reportWithBoundaryCoords = {
          ...validReportData,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        const mockCreatedReport = {
          id: 1,
          ...reportWithBoundaryCoords,
          status: "PENDING_APPROVAL",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1 },
          photos: [],
        };

        mockCreate.mockResolvedValue(mockCreatedReport);

        await createReport(reportWithBoundaryCoords);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          })
        );

        jest.clearAllMocks();
      }
    });
  });

  describe("getApprovedReports", () => {
    it("should return approved reports ordered by creation date", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Recent report",
          description: "Recent issue",
          category: "PUBLIC_LIGHTING",
          latitude: 45.0703,
          longitude: 7.6869,
          status: "ASSIGNED",
          createdAt: new Date("2023-12-01"),
          user: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
          },
        },
        {
          id: 2,
          title: "Older report",
          description: "Older issue",
          category: "ROADS_AND_URBAN_FURNISHINGS",
          latitude: 45.0704,
          longitude: 7.687,
          status: "IN_PROGRESS",
          createdAt: new Date("2023-11-01"),
          user: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockReports);

      const result = await getApprovedReports();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"],
          },
        },
        include: {
          user: true,
          photos: true,
          messages: { include: { user: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockReports);
    });

    it("should return empty array when no approved reports exist", async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await getApprovedReports();

      expect(mockFindMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should filter out pending and rejected reports", async () => {
      const mockApprovedReports = [
        {
          id: 1,
          status: "ASSIGNED",
          user: {
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
          },
        },
        {
          id: 2,
          status: "IN_PROGRESS",
          user: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
          },
        },
        {
          id: 3,
          status: "RESOLVED",
          user: {
            first_name: "Bob",
            last_name: "Johnson",
            email: "bob@example.com",
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockApprovedReports);

      const result = await getApprovedReports();

      // Verifica che la query filtri correttamente gli stati
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"],
          },
        },
        include: {
          user: true,
          photos: true,
          messages: { include: { user: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockApprovedReports);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database query failed");
      mockFindMany.mockRejectedValue(error);

      await expect(getApprovedReports()).rejects.toThrow(error);

      expect(mockFindMany).toHaveBeenCalled();
    });

    it("should include user information in results", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Test report",
          description: "Test description",
          category: "PUBLIC_LIGHTING",
          latitude: 45.0703,
          longitude: 7.6869,
          status: "ASSIGNED",
          user: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockReports);

      const result = await getApprovedReports();

      expect(result[0].user).toEqual({
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
      });
    });

    it("should order reports by creation date descending", async () => {
      mockFindMany.mockResolvedValue([]);

      await getApprovedReports();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });
  });

  describe("approveReport", () => {
    const reportId = 42;
    const approverId = 7;

    afterEach(() => jest.clearAllMocks());

    it("should throw NotFoundError when report does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);
      const { approveReport } = require("../../../src/services/reportService");
      await expect(approveReport(reportId, approverId)).rejects.toThrow(
        "Report not found"
      );
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: reportId },
        include: { user: true },
      });
    });

    it("should throw BadRequestError when report status is not PENDING_APPROVAL", async () => {
      mockFindUnique.mockResolvedValue({ id: reportId, status: "ASSIGNED" });
      const { approveReport } = require("../../../src/services/reportService");
      await expect(approveReport(reportId, approverId)).rejects.toThrow(
        "Report is not in PENDING_APPROVAL status"
      );
    });

    it("should update report to ASSIGNED and add approval message", async () => {
      const existing = { id: reportId, status: "PENDING_APPROVAL" };
      const updated = {
        id: reportId,
        status: "ASSIGNED",
        messages: [
          {
            id: 1,
            content: "Report approved by public relations officer",
            senderId: approverId,
          },
        ],
        user: { id: 2 },
        photos: [],
      };

      mockFindUnique.mockResolvedValue(existing);
      mockUpdate.mockResolvedValue(updated);

      const { approveReport } = require("../../../src/services/reportService");
      const result = await approveReport(reportId, approverId);

      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: reportId },
        data: {
          status: "ASSIGNED",
          messages: {
            create: {
              content: "Report approved by public relations officer",
              senderId: approverId,
            },
          },
        },
        include: {
          user: true,
          photos: true,
          messages: { include: { user: true } },
        },
      });

      expect(result).toEqual(updated);
    });
  });

  describe("rejectReport", () => {
    const reportId = 43;
    const rejecterId = 8;

    afterEach(() => jest.clearAllMocks());

    it("should reject when reason is empty", async () => {
      const { rejectReport } = require("../../../src/services/reportService");
      await expect(rejectReport(reportId, rejecterId, "")).rejects.toThrow(
        "Rejection reason is required"
      );
    });

    it("should reject when reason is too long", async () => {
      const longReason = "a".repeat(501);
      const { rejectReport } = require("../../../src/services/reportService");
      await expect(
        rejectReport(reportId, rejecterId, longReason)
      ).rejects.toThrow("Rejection reason must be less than 500 characters");
    });

    it("should throw NotFoundError when report does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);
      const { rejectReport } = require("../../../src/services/reportService");
      await expect(
        rejectReport(reportId, rejecterId, "Invalid report")
      ).rejects.toThrow("Report not found");
    });

    it("should throw BadRequestError when report status is not PENDING_APPROVAL", async () => {
      mockFindUnique.mockResolvedValue({ id: reportId, status: "ASSIGNED" });
      const { rejectReport } = require("../../../src/services/reportService");
      await expect(
        rejectReport(reportId, rejecterId, "Reason")
      ).rejects.toThrow("Report is not in PENDING_APPROVAL status");
    });

    it("should update report to REJECTED and set rejectionReason", async () => {
      const existing = { id: reportId, status: "PENDING_APPROVAL" };
      const updated = {
        id: reportId,
        status: "REJECTED",
        rejectionReason: "Not a valid report",
        messages: [
          {
            id: 2,
            content: "Report rejected by public relations officer",
            senderId: rejecterId,
          },
        ],
        user: { id: 3 },
        photos: [],
      };

      mockFindUnique.mockResolvedValue(existing);
      mockUpdate.mockResolvedValue(updated);

      const { rejectReport } = require("../../../src/services/reportService");
      const result = await rejectReport(
        reportId,
        rejecterId,
        "Not a valid report"
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: reportId },
        data: {
          status: "REJECTED",
          rejectionReason: "Not a valid report",
          messages: {
            create: {
              content: "Report rejected by public relations officer",
              senderId: rejecterId,
            },
          },
        },
        include: {
          user: true,
          photos: true,
          messages: { include: { user: true } },
        },
      });

      expect(result).toEqual(updated);
    });
  });
});
