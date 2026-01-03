import { Repository, SelectQueryBuilder } from "typeorm";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { Report } from "../../../src/entities/Report";
import { AppDataSource } from "../../../src/utils/AppDataSource";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import { BoundingBox } from "../../../src/services/geocodingService";

jest.mock("../../../src/utils/AppDataSource");

describe("ReportRepository Unit Tests - Search by Address Feature", () => {
  let reportRepository: ReportRepository;
  let mockRepository: jest.Mocked<Repository<Report>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Report>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the QueryBuilder
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    // Mock the Repository
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    reportRepository = new ReportRepository();
  });

  // =========================
  // findByStatusCategoryAndBounds tests
  // =========================
  describe("findByStatusCategoryAndBounds", () => {
    it("should return all reports with specified statuses when no category or bbox filter", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Report 1",
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
          status: ReportStatus.IN_PROGRESS,
          latitude: 45.0745,
          longitude: 7.6875,
          user: { id: 2 },
          photos: [],
          messages: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const statuses = [
        ReportStatus.ASSIGNED,
        ReportStatus.EXTERNAL_ASSIGNED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ];
      const result = await reportRepository.findByStatusCategoryAndBounds(
        statuses
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("report");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "report.status IN (:...statuses)",
        { statuses }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "report.createdAt",
        "DESC"
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it("should filter reports by category", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Water supply issue",
          category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const statuses = [ReportStatus.ASSIGNED];
      const result = await reportRepository.findByStatusCategoryAndBounds(
        statuses,
        ReportCategory.WATER_SUPPLY_DRINKING_WATER
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.category = :category",
        { category: ReportCategory.WATER_SUPPLY_DRINKING_WATER }
      );
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(
        ReportCategory.WATER_SUPPLY_DRINKING_WATER
      );
    });

    it("should filter reports by bounding box coordinates", async () => {
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

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const bbox: BoundingBox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const statuses = [ReportStatus.ASSIGNED];
      const result = await reportRepository.findByStatusCategoryAndBounds(
        statuses,
        undefined,
        bbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: 45.0,
          maxLat: 45.2,
          minLon: 7.5,
          maxLon: 7.8,
        }
      );
      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(45.1);
      expect(result[0].longitude).toBe(7.65);
    });

    it("should filter by both category and bounding box", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Road signs in area",
          category: ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
          latitude: 45.1,
          longitude: 7.65,
          status: ReportStatus.ASSIGNED,
          user: { id: 1 },
          photos: [],
          messages: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const bbox: BoundingBox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const statuses = [
        ReportStatus.ASSIGNED,
        ReportStatus.EXTERNAL_ASSIGNED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ];
      const result = await reportRepository.findByStatusCategoryAndBounds(
        statuses,
        ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
        bbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        "report.category = :category",
        { category: ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        expect.objectContaining({
          minLat: 45.0,
          maxLat: 45.2,
          minLon: 7.5,
          maxLon: 7.8,
        })
      );
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no reports match filters", async () => {
      const mockReports: Report[] = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const bbox: BoundingBox = {
        minLon: 7.5,
        minLat: 45.0,
        maxLon: 7.8,
        maxLat: 45.2,
      };

      const result = await reportRepository.findByStatusCategoryAndBounds(
        [ReportStatus.ASSIGNED],
        ReportCategory.WASTE,
        bbox
      );

      expect(result).toEqual([]);
    });

    it("should load all required relations", async () => {
      const mockReports: Report[] = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const statuses = [ReportStatus.ASSIGNED];
      await reportRepository.findByStatusCategoryAndBounds(statuses);

      // Verify all relations are loaded
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.user",
        "user"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.photos",
        "photos"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.messages",
        "messages"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "messages.user",
        "messageUser"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.assignedOfficer",
        "assignedOfficer"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.externalMaintainer",
        "externalMaintainer"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "externalMaintainer.externalCompany",
        "externalCompany"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "report.externalCompany",
        "directExternalCompany"
      );
    });

    it("should order results by creation date descending", async () => {
      const mockReports: Report[] = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const statuses = [ReportStatus.ASSIGNED];
      await reportRepository.findByStatusCategoryAndBounds(statuses);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "report.createdAt",
        "DESC"
      );
    });

    it("should handle multiple statuses correctly", async () => {
      const mockReports = [
        { id: 1, status: ReportStatus.ASSIGNED },
        { id: 2, status: ReportStatus.EXTERNAL_ASSIGNED },
        { id: 3, status: ReportStatus.IN_PROGRESS },
        { id: 4, status: ReportStatus.RESOLVED },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const statuses = [
        ReportStatus.ASSIGNED,
        ReportStatus.EXTERNAL_ASSIGNED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ];

      await reportRepository.findByStatusCategoryAndBounds(statuses);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "report.status IN (:...statuses)",
        { statuses }
      );
    });

    it("should handle bounding box with decimal precision", async () => {
      const mockReports: Report[] = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const bbox: BoundingBox = {
        minLon: 7.654321,
        minLat: 45.0123456,
        maxLon: 7.7654321,
        maxLat: 45.1234567,
      };

      await reportRepository.findByStatusCategoryAndBounds(
        [ReportStatus.ASSIGNED],
        undefined,
        bbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: 45.0123456,
          maxLat: 45.1234567,
          minLon: 7.654321,
          maxLon: 7.7654321,
        }
      );
    });

    it("should handle bounding box with negative coordinates", async () => {
      const mockReports: Report[] = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const bbox: BoundingBox = {
        minLon: -0.5,
        minLat: -45.0,
        maxLon: 0.8,
        maxLat: 45.2,
      };

      await reportRepository.findByStatusCategoryAndBounds(
        [ReportStatus.ASSIGNED],
        undefined,
        bbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: -45.0,
          maxLat: 45.2,
          minLon: -0.5,
          maxLon: 0.8,
        }
      );
    });

    it("should return multiple reports in correct order", async () => {
      const mockReports = [
        {
          id: 3,
          title: "Newest report",
          createdAt: new Date("2024-01-03"),
          user: { id: 1 },
          photos: [],
          messages: [],
        },
        {
          id: 2,
          title: "Middle report",
          createdAt: new Date("2024-01-02"),
          user: { id: 2 },
          photos: [],
          messages: [],
        },
        {
          id: 1,
          title: "Oldest report",
          createdAt: new Date("2024-01-01"),
          user: { id: 3 },
          photos: [],
          messages: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const result = await reportRepository.findByStatusCategoryAndBounds([
        ReportStatus.ASSIGNED,
      ]);

      // Verify order is maintained from query
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it("should handle very small bounding boxes (zoom 18+)", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([] as any);

      const smallBbox: BoundingBox = {
        minLon: 7.686,
        minLat: 45.0731,
        maxLon: 7.687,
        maxLat: 45.0741,
      };

      await reportRepository.findByStatusCategoryAndBounds(
        [ReportStatus.ASSIGNED],
        undefined,
        smallBbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: 45.0731,
          maxLat: 45.0741,
          minLon: 7.686,
          maxLon: 7.687,
        }
      );
    });

    it("should handle large bounding boxes (zoom 12)", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([] as any);

      const largeBbox: BoundingBox = {
        minLon: 7.0,
        minLat: 44.5,
        maxLon: 8.5,
        maxLat: 45.5,
      };

      await reportRepository.findByStatusCategoryAndBounds(
        [ReportStatus.ASSIGNED],
        undefined,
        largeBbox
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "report.latitude BETWEEN :minLat AND :maxLat AND report.longitude BETWEEN :minLon AND :maxLon",
        {
          minLat: 44.5,
          maxLat: 45.5,
          minLon: 7.0,
          maxLon: 8.5,
        }
      );
    });

    it("should include all report metadata in results", async () => {
      const mockReports = [
        {
          id: 1,
          title: "Complete Report",
          description: "Full description",
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.ASSIGNED,
          latitude: 45.1,
          longitude: 7.65,
          address: "Via Roma, Turin",
          isAnonymous: false,
          user: {
            id: 1,
            email: "citizen@test.com",
            first_name: "John",
          },
          photos: [
            {
              id: 1,
              filename: "photo1.jpg",
              url: "http://example.com/photo1.jpg",
            },
          ],
          messages: [
            {
              id: 1,
              content: "Test message",
              user: { id: 2, email: "tech@test.com" },
            },
          ],
          assignedOfficer: {
            id: 2,
            email: "tech@test.com",
          },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockReports as any);

      const result = await reportRepository.findByStatusCategoryAndBounds([
        ReportStatus.ASSIGNED,
      ]);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("latitude");
      expect(result[0]).toHaveProperty("longitude");
      expect(result[0]).toHaveProperty("user");
      expect(result[0]).toHaveProperty("photos");
      expect(result[0]).toHaveProperty("messages");
      expect(result[0]).toHaveProperty("assignedOfficer");
    });

    it("should filter by each report category independently", async () => {
      const categories = [
        ReportCategory.WATER_SUPPLY_DRINKING_WATER,
        ReportCategory.WASTE,
        ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
      ];

      for (const category of categories) {
        jest.clearAllMocks();
        mockQueryBuilder.getMany.mockResolvedValue([] as any);

        await reportRepository.findByStatusCategoryAndBounds(
          [ReportStatus.ASSIGNED],
          category
        );

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          "report.category = :category",
          { category }
        );
      }
    });
  });
});
