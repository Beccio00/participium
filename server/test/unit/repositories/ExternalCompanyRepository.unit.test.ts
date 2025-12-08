import { Repository } from "typeorm";
import { ExternalCompanyRepository } from "../../../src/repositories/ExternalCompanyRepository";
import { ExternalCompany } from "../../../src/entities/ExternalCompany";
import { AppDataSource } from "../../../src/utils/AppDataSource";
import { ReportCategory } from "../../../../shared/ReportTypes";

jest.mock("../../../src/utils/AppDataSource");

describe("ExternalCompanyRepository Unit Tests - PT25", () => {
  let externalCompanyRepository: ExternalCompanyRepository;
  let mockRepository: jest.Mocked<Repository<ExternalCompany>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    externalCompanyRepository = new ExternalCompanyRepository();
  });

  describe("findById", () => {
    it("should return company by ID with maintainers", async () => {
      const mockCompany = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
        maintainers: [
          {
            id: 501,
            first_name: "Marco",
            last_name: "Bianchi",
            email: "marco@enelx.com",
            role: "EXTERNAL_MAINTAINER",
          },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockCompany as any);

      const result = await externalCompanyRepository.findById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["maintainers"],
      });
      expect(result).toEqual(mockCompany);
    });

    it("should return null if company not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await externalCompanyRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("findByCategory", () => {
    it("should return companies that handle the specified category", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: [],
        },
        {
          id: 2,
          name: "Street Lights Ltd",
          categories: [ReportCategory.PUBLIC_LIGHTING, ReportCategory.ROADS_URBAN_FURNISHINGS],
          platformAccess: false,
          maintainers: [],
        },
        {
          id: 3,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByCategory(ReportCategory.PUBLIC_LIGHTING);

      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ["maintainers"] });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Enel X");
      expect(result[1].name).toBe("Street Lights Ltd");
    });

    it("should return empty array if no companies handle the category", async () => {
      const mockCompanies = [
        {
          id: 3,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByCategory(ReportCategory.PUBLIC_LIGHTING);

      expect(result).toHaveLength(0);
    });

    it("should handle companies with empty categories array", async () => {
      const mockCompanies = [
        {
          id: 4,
          name: "Empty Company",
          categories: [],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByCategory(ReportCategory.PUBLIC_LIGHTING);

      expect(result).toHaveLength(0);
    });

    it("should handle companies with non-array categories", async () => {
      const mockCompanies = [
        {
          id: 5,
          name: "Invalid Company",
          categories: null,
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByCategory(ReportCategory.PUBLIC_LIGHTING);

      expect(result).toHaveLength(0);
    });
  });

  describe("findWithMaintainersByIds", () => {
    it("should return companies with maintainers for given IDs", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: [
            {
              id: 501,
              first_name: "Marco",
              last_name: "Bianchi",
              email: "marco@enelx.com",
            },
          ],
        },
        {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findWithMaintainersByIds([1, 2]);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
        relations: ["maintainers"],
      });
      expect(result).toEqual(mockCompanies);
    });

    it("should return empty array if no companies match IDs", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await externalCompanyRepository.findWithMaintainersByIds([999, 888]);

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create and return new external company", async () => {
      const companyData = {
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const mockSavedCompany = {
        id: 1,
        ...companyData,
        maintainers: [],
        reports: [],
      };

      mockRepository.save.mockResolvedValue(mockSavedCompany as any);

      const result = await externalCompanyRepository.create(companyData);

      expect(mockRepository.save).toHaveBeenCalledWith(companyData);
      expect(result).toEqual(mockSavedCompany);
    });

    it("should create company without platform access", async () => {
      const companyData = {
        name: "AMIAT",
        categories: [ReportCategory.WASTE],
        platformAccess: false,
      };

      const mockSavedCompany = {
        id: 2,
        ...companyData,
        maintainers: [],
        reports: [],
      };

      mockRepository.save.mockResolvedValue(mockSavedCompany as any);

      const result = await externalCompanyRepository.create(companyData);

      expect(result.platformAccess).toBe(false);
      expect(result.name).toBe("AMIAT");
    });
  });

  describe("findAll", () => {
    it("should return all companies with maintainers", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: [
            {
              id: 501,
              first_name: "Marco",
              last_name: "Bianchi",
            },
          ],
        },
        {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ["maintainers"] });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Enel X");
    });

    it("should return empty array if no companies exist", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await externalCompanyRepository.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe("findByPlatformAccess", () => {
    it("should return companies with platform access", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByPlatformAccess(true);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { platformAccess: true },
        relations: ["maintainers"],
      });
      expect(result).toHaveLength(1);
      expect(result[0].platformAccess).toBe(true);
    });

    it("should return companies without platform access", async () => {
      const mockCompanies = [
        {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [],
        },
      ];

      mockRepository.find.mockResolvedValue(mockCompanies as any);

      const result = await externalCompanyRepository.findByPlatformAccess(false);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { platformAccess: false },
        relations: ["maintainers"],
      });
      expect(result[0].platformAccess).toBe(false);
    });

    it("should return empty array if no companies match criteria", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await externalCompanyRepository.findByPlatformAccess(true);

      expect(result).toHaveLength(0);
    });
  });

  describe("deleteById", () => {
    it("should delete company and return true", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      const result = await externalCompanyRepository.deleteById(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false if company not found", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      const result = await externalCompanyRepository.deleteById(999);

      expect(result).toBe(false);
    });

    it("should handle undefined affected value", async () => {
      mockRepository.delete.mockResolvedValue({ affected: undefined, raw: {} } as any);

      const result = await externalCompanyRepository.deleteById(1);

      expect(result).toBe(false);
    });
  });
});
