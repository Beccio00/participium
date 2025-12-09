import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import { Role } from "../../../../shared/RoleTypes";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../../src/utils/errors";

// 1. Define the mock objects FIRST
const mockExternalCompanyRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCategory: jest.fn(),
  findByPlatformAccess: jest.fn(),
  deleteById: jest.fn(),
};

const mockUserRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByRole: jest.fn(),
  findByRoles: jest.fn(),
  delete: jest.fn(),
  findExternalMaintainersWithCompany: jest.fn(),
  findExternalMaintainerByIdWithCompany: jest.fn(),
};

const mockReportRepo = {
  findById: jest.fn(),
  findByIdWithRelations: jest.fn(),
  update: jest.fn(),
  findAssignedToUser: jest.fn(),
};

const mockReportMessageRepo = {
  create: jest.fn(),
};

// 2. Mock the repositories
jest.mock("../../../src/repositories/ExternalCompanyRepository", () => ({
  ExternalCompanyRepository: jest.fn().mockImplementation(() => mockExternalCompanyRepo),
}));

jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => mockUserRepo),
}));

jest.mock("../../../src/repositories/ReportRepository", () => ({
  ReportRepository: jest.fn().mockImplementation(() => mockReportRepo),
}));

jest.mock("../../../src/repositories/ReportMessageRepository", () => ({
  ReportMessageRepository: jest.fn().mockImplementation(() => mockReportMessageRepo),
}));

// 3. Mock notification service
const mockNotifyReportStatusChange = jest.fn();
const mockNotifyReportAssigned = jest.fn();

jest.mock("../../../src/services/notificationService", () => ({
  notifyReportStatusChange: mockNotifyReportStatusChange,
  notifyReportAssigned: mockNotifyReportAssigned,
}));

// 4. Mock bcrypt
jest.mock("bcrypt", () => ({
  genSalt: jest.fn().mockResolvedValue("mockedSalt"),
  hash: jest.fn().mockResolvedValue("mockedHashedPassword"),
}));

// Now import the service
import * as externalService from "../../../src/services/externalService";

describe("External Service Unit Tests - PT25", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // CREATE EXTERNAL COMPANY TESTS
  // =========================
  describe("createExternalCompany", () => {
    it("should create external company with valid data", async () => {
      const companyData = {
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
        maintainers: [],
      };

      mockExternalCompanyRepo.create.mockResolvedValue(mockCompany);

      const result = await externalService.createExternalCompany(companyData);

      expect(mockExternalCompanyRepo.create).toHaveBeenCalledWith({
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      });
      expect(result).toEqual({
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      });
    });

    it("should throw error if name is missing", async () => {
      const companyData = {
        name: "",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      await expect(externalService.createExternalCompany(companyData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if categories array is empty", async () => {
      const companyData = {
        name: "Test Company",
        categories: [],
        platformAccess: true,
      };

      await expect(externalService.createExternalCompany(companyData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if more than 2 categories", async () => {
      const companyData = {
        name: "Test Company",
        categories: [
          ReportCategory.PUBLIC_LIGHTING,
          ReportCategory.WASTE,
          ReportCategory.ROADS_URBAN_FURNISHINGS,
        ],
        platformAccess: true,
      };

      await expect(externalService.createExternalCompany(companyData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if invalid category", async () => {
      const companyData = {
        name: "Test Company",
        categories: ["INVALID_CATEGORY" as any],
        platformAccess: true,
      };

      await expect(externalService.createExternalCompany(companyData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if platformAccess is not boolean", async () => {
      const companyData = {
        name: "Test Company",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: "true" as any,
      };

      await expect(externalService.createExternalCompany(companyData))
        .rejects
        .toThrow(BadRequestError);
    });
  });

  // =========================
  // CREATE EXTERNAL MAINTAINER TESTS
  // =========================
  describe("createExternalMaintainer", () => {
    it("should create external maintainer with valid data", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco.bianchi@enelx.com",
        password: "External123!",
        externalCompanyId: "1",
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        platformAccess: true,
      };

      const mockUser = {
        id: 501,
        first_name: "Marco",
        last_name: "Bianchi",
        email: "marco.bianchi@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
        externalCompanyId: 1,
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await externalService.createExternalMaintainer(maintainerData);

      expect(mockExternalCompanyRepo.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("marco.bianchi@enelx.com");
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 501,
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco.bianchi@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
      });
    });

    it("should throw error if company not found", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco@test.com",
        password: "Test123!",
        externalCompanyId: "999",
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(null);

      await expect(externalService.createExternalMaintainer(maintainerData))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if company does not have platform access", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco@test.com",
        password: "Test123!",
        externalCompanyId: "1",
      };

      const mockCompany = {
        id: 1,
        name: "AMIAT",
        platformAccess: false,
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);

      await expect(externalService.createExternalMaintainer(maintainerData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if email already exists", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "existing@test.com",
        password: "Test123!",
        externalCompanyId: "1",
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        platformAccess: true,
      };

      const existingUser = {
        id: 10,
        email: "existing@test.com",
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findByEmail.mockResolvedValue(existingUser);

      await expect(externalService.createExternalMaintainer(maintainerData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if firstName is missing", async () => {
      const maintainerData = {
        firstName: "",
        lastName: "Bianchi",
        email: "test@test.com",
        password: "Test123!",
        externalCompanyId: "1",
      };

      await expect(externalService.createExternalMaintainer(maintainerData as any))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if lastName is missing", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "",
        email: "test@test.com",
        password: "Test123!",
        externalCompanyId: "1",
      };

      await expect(externalService.createExternalMaintainer(maintainerData as any))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if email is missing", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "",
        password: "Test123!",
        externalCompanyId: "1",
      };

      await expect(externalService.createExternalMaintainer(maintainerData as any))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if password is too short", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "test@test.com",
        password: "short",
        externalCompanyId: "1",
      };

      await expect(externalService.createExternalMaintainer(maintainerData))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if externalCompanyId is invalid", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "test@test.com",
        password: "Test123!",
        externalCompanyId: "invalid",
      };

      await expect(externalService.createExternalMaintainer(maintainerData))
        .rejects
        .toThrow(BadRequestError);
    });
  });

  // =========================
  // GET ASSIGNABLE EXTERNALS TESTS (PT25)
  // =========================
  describe("getAssignableExternals", () => {
    it("should return external companies for report category", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
      };

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
              role: Role.EXTERNAL_MAINTAINER,
            },
          ],
        },
      ];

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findByCategory.mockResolvedValue(mockCompanies);

      const result = await externalService.getAssignableExternals(1, 2);

      expect(mockReportRepo.findByIdWithRelations).toHaveBeenCalledWith(1);
      expect(mockExternalCompanyRepo.findByCategory).toHaveBeenCalledWith(ReportCategory.PUBLIC_LIGHTING);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Enel X");
      expect(result[0].users).toHaveLength(1);
      expect(result[0].users![0].firstName).toBe("Marco");
    });

    it("should return empty array for users when company has platform access but undefined maintainers", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
      };

      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: undefined,
        },
      ];

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findByCategory.mockResolvedValue(mockCompanies);

      const result = await externalService.getAssignableExternals(1, 2);

      expect(result).toHaveLength(1);
      expect(result[0].hasPlatformAccess).toBe(true);
      expect(result[0].users).toEqual([]);
    });

    it("should return null for users when company has no platform access", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.WASTE,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
      };

      const mockCompanies = [
        {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: [
            {
              id: 502,
              first_name: "Test",
              last_name: "User",
            },
          ],
        },
      ];

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findByCategory.mockResolvedValue(mockCompanies);

      const result = await externalService.getAssignableExternals(1, 2);

      expect(result).toHaveLength(1);
      expect(result[0].hasPlatformAccess).toBe(false);
      expect(result[0].users).toBeNull();
    });

    it("should throw error if report not found", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(externalService.getAssignableExternals(999, 2))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if user not assigned to report", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 3,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);

      await expect(externalService.getAssignableExternals(1, 2))
        .rejects
        .toThrow(ForbiddenError);
    });
  });

  // =========================
  // ASSIGN REPORT TO EXTERNAL TESTS (PT25)
  // =========================
  describe("assignReportToExternal", () => {
    it("should assign report to external maintainer (company with platform access)", async () => {
      const mockReport = {
        id: 1,
        title: "Broken light",
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        userId: 100,
        externalCompanyId: null,
        externalMaintainerId: null,
        messages: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const mockMaintainer = {
        id: 501,
        first_name: "Marco",
        last_name: "Bianchi",
        role: Role.EXTERNAL_MAINTAINER,
        externalCompanyId: 1,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findById.mockResolvedValue(mockMaintainer);
      mockReportRepo.update.mockResolvedValue({ ...mockReport, externalCompanyId: 1, externalMaintainerId: 501 });

      const result = await externalService.assignReportToExternal(
        1,
        2,
        1,
        501
      );

      expect(mockReportRepo.findByIdWithRelations).toHaveBeenCalledWith(1);
      expect(mockExternalCompanyRepo.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(501);
      expect(mockNotifyReportAssigned).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("should assign report to company only (no platform access)", async () => {
      const mockReport = {
        id: 1,
        title: "Waste issue",
        category: ReportCategory.WASTE,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        userId: 100,
        externalCompanyId: null,
        externalMaintainerId: null,
        messages: [],
      };

      const mockCompany = {
        id: 2,
        name: "AMIAT",
        categories: [ReportCategory.WASTE],
        platformAccess: false,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockReportRepo.update.mockResolvedValue({ ...mockReport, externalCompanyId: 2 });

      const result = await externalService.assignReportToExternal(
        1,
        2,
        2,
        null
      );

      expect(mockUserRepo.findById).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("should throw error if report not found", async () => {
      mockReportRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(externalService.assignReportToExternal(999, 2, 1, 501))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if user not assigned to report", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 3,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(ForbiddenError);
    });

    it("should throw error if company not found", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(null);

      await expect(externalService.assignReportToExternal(1, 2, 999, 501))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if maintainer required but not provided", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.PUBLIC_LIGHTING,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        externalCompanyId: null,
        externalMaintainerId: null,
      };

      const mockCompany = {
        id: 1,
        platformAccess: true,
        categories: [ReportCategory.PUBLIC_LIGHTING],
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);

      await expect(externalService.assignReportToExternal(1, 2, 1, null))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if maintainer provided but company has no platform access", async () => {
      const mockReport = {
        id: 1,
        category: ReportCategory.WASTE,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
      };

      const mockCompany = {
        id: 2,
        platformAccess: false,
        categories: [ReportCategory.WASTE],
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);

      await expect(externalService.assignReportToExternal(1, 2, 2, 501))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if report status is not ASSIGNED", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.PENDING_APPROVAL,
        assignedOfficerId: 2,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if report already assigned to external", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        externalCompanyId: 1,
        externalMaintainerId: null,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if maintainer not found", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        externalCompanyId: null,
        externalMaintainerId: null,
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        platformAccess: true,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if user is not external maintainer", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        externalCompanyId: null,
        externalMaintainerId: null,
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        platformAccess: true,
      };

      const mockUser = {
        id: 501,
        role: Role.ADMINISTRATOR,
        externalCompanyId: 1,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findById.mockResolvedValue(mockUser);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if maintainer does not belong to company", async () => {
      const mockReport = {
        id: 1,
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 2,
        externalCompanyId: null,
        externalMaintainerId: null,
      };

      const mockCompany = {
        id: 1,
        name: "Enel X",
        platformAccess: true,
      };

      const mockMaintainer = {
        id: 501,
        role: Role.EXTERNAL_MAINTAINER,
        externalCompanyId: 2,
      };

      mockReportRepo.findByIdWithRelations.mockResolvedValue(mockReport);
      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findById.mockResolvedValue(mockMaintainer);

      await expect(externalService.assignReportToExternal(1, 2, 1, 501))
        .rejects
        .toThrow(BadRequestError);
    });
  });

  // =========================
  // LIST EXTERNAL COMPANIES TESTS
  // =========================
  describe("listExternalCompanies", () => {
    it("should return all external companies with maintainers", async () => {
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
              role: Role.EXTERNAL_MAINTAINER,
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

      mockExternalCompanyRepo.findAll.mockResolvedValue(mockCompanies);

      const result = await externalService.listExternalCompanies();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Enel X");
      expect(result[0].users).toHaveLength(1);
      expect(result[1].name).toBe("AMIAT");
      expect(result[1].users).toHaveLength(0);
    });

    it("should handle companies with undefined maintainers", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Test Company",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
          maintainers: undefined,
        },
      ];

      mockExternalCompanyRepo.findAll.mockResolvedValue(mockCompanies);

      const result = await externalService.listExternalCompanies();

      expect(result).toHaveLength(1);
      expect(result[0].users).toBeNull();
    });
  });

  // =========================
  // GET EXTERNAL COMPANIES WITH ACCESS TESTS
  // =========================
  describe("getExternalCompaniesWithAccess", () => {
    it("should return only companies with platform access", async () => {
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
              role: Role.EXTERNAL_MAINTAINER,
            },
          ],
        },
      ];

      mockExternalCompanyRepo.findByPlatformAccess.mockResolvedValue(mockCompanies);

      const result = await externalService.getExternalCompaniesWithAccess();

      expect(mockExternalCompanyRepo.findByPlatformAccess).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Enel X");
      expect(result[0].platformAccess).toBe(true);
      expect(result[0].users).toHaveLength(1);
    });

    it("should return empty array if no companies have platform access", async () => {
      mockExternalCompanyRepo.findByPlatformAccess.mockResolvedValue([]);

      const result = await externalService.getExternalCompaniesWithAccess();

      expect(result).toHaveLength(0);
    });

    it("should handle companies with null maintainers", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          maintainers: null,
        },
      ];

      mockExternalCompanyRepo.findByPlatformAccess.mockResolvedValue(mockCompanies);

      const result = await externalService.getExternalCompaniesWithAccess();

      expect(result[0].users).toBeNull();
    });
  });

  // =========================
  // GET ALL EXTERNAL MAINTAINERS TESTS
  // =========================
  describe("getAllExternalMaintainers", () => {
    it("should return all external maintainers", async () => {
      const mockMaintainers = [
        {
          id: 501,
          first_name: "Marco",
          last_name: "Bianchi",
          email: "marco@enelx.com",
          role: Role.EXTERNAL_MAINTAINER,
          externalCompany: {
            id: 1,
            name: "Enel X",
            categories: [ReportCategory.PUBLIC_LIGHTING],
            platformAccess: true,
          },
        },
        {
          id: 502,
          first_name: "Laura",
          last_name: "Rossi",
          email: "laura@enelx.com",
          role: Role.EXTERNAL_MAINTAINER,
          externalCompany: {
            id: 1,
            name: "Enel X",
            categories: [ReportCategory.PUBLIC_LIGHTING],
            platformAccess: true,
          },
        },
      ];

      mockUserRepo.findExternalMaintainersWithCompany.mockResolvedValue(mockMaintainers);

      const result = await externalService.getAllExternalMaintainers();

      expect(mockUserRepo.findExternalMaintainersWithCompany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe("Marco");
      expect(result[1].firstName).toBe("Laura");
    });

    it("should filter out null DTOs", async () => {
      const mockMaintainers = [
        {
          id: 501,
          first_name: "Marco",
          last_name: "Bianchi",
          email: "marco@enelx.com",
          role: Role.EXTERNAL_MAINTAINER,
          externalCompany: {
            id: 1,
            name: "Enel X",
            categories: [ReportCategory.PUBLIC_LIGHTING],
            platformAccess: true,
          },
        },
        {
          id: 502,
          first_name: "Invalid",
          last_name: "User",
          email: "invalid@test.com",
          role: Role.EXTERNAL_MAINTAINER,
          externalCompany: null,
        },
      ];

      mockUserRepo.findExternalMaintainersWithCompany.mockResolvedValue(mockMaintainers);

      const result = await externalService.getAllExternalMaintainers();

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe("Marco");
    });
  });

  // =========================
  // GET EXTERNAL MAINTAINER BY ID TESTS
  // =========================
  describe("getExternalMaintainerById", () => {
    it("should return external maintainer by ID", async () => {
      const mockMaintainer = {
        id: 501,
        first_name: "Marco",
        last_name: "Bianchi",
        email: "marco@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
        externalCompany: {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        },
      };

      mockUserRepo.findExternalMaintainerByIdWithCompany.mockResolvedValue(mockMaintainer);

      const result = await externalService.getExternalMaintainerById(501);

      expect(mockUserRepo.findExternalMaintainerByIdWithCompany).toHaveBeenCalledWith(501);
      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("Marco");
    });

    it("should return null if maintainer not found", async () => {
      mockUserRepo.findExternalMaintainerByIdWithCompany.mockResolvedValue(null);

      const result = await externalService.getExternalMaintainerById(999);

      expect(result).toBeNull();
    });
  });

  // =========================
  // DELETE EXTERNAL MAINTAINER TESTS
  // =========================
  describe("deleteExternalMaintainer", () => {
    it("should delete external maintainer successfully", async () => {
      const mockMaintainer = {
        id: 501,
        role: Role.EXTERNAL_MAINTAINER,
      };

      mockUserRepo.findById.mockResolvedValue(mockMaintainer);
      mockReportRepo.findAssignedToUser.mockResolvedValue([]);
      mockUserRepo.delete.mockResolvedValue(true);

      const result = await externalService.deleteExternalMaintainer(501);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(501);
      expect(mockReportRepo.findAssignedToUser).toHaveBeenCalledWith(501, [
        ReportStatus.ASSIGNED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ]);
      expect(mockUserRepo.delete).toHaveBeenCalledWith(501);
      expect(result).toBe(true);
    });

    it("should return false if maintainer not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await externalService.deleteExternalMaintainer(999);

      expect(result).toBe(false);
    });

    it("should return false if user is not an external maintainer", async () => {
      const mockUser = {
        id: 2,
        role: Role.ADMINISTRATOR,
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await externalService.deleteExternalMaintainer(2);

      expect(result).toBe(false);
    });

    it("should throw error if maintainer has assigned reports", async () => {
      const mockMaintainer = {
        id: 501,
        role: Role.EXTERNAL_MAINTAINER,
      };

      const mockReports = [
        { id: 1, status: ReportStatus.ASSIGNED },
        { id: 2, status: ReportStatus.IN_PROGRESS },
      ];

      mockUserRepo.findById.mockResolvedValue(mockMaintainer);
      mockReportRepo.findAssignedToUser.mockResolvedValue(mockReports);

      await expect(externalService.deleteExternalMaintainer(501))
        .rejects
        .toThrow(BadRequestError);
    });
  });

  // =========================
  // DELETE EXTERNAL COMPANY TESTS
  // =========================
  describe("deleteExternalCompany", () => {
    it("should delete external company successfully", async () => {
      const mockCompany = {
        id: 1,
        name: "Test Company",
        maintainers: [],
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockExternalCompanyRepo.deleteById.mockResolvedValue(true);

      await externalService.deleteExternalCompany(1);

      expect(mockExternalCompanyRepo.findById).toHaveBeenCalledWith(1);
      expect(mockExternalCompanyRepo.deleteById).toHaveBeenCalledWith(1);
    });

    it("should throw error if company not found", async () => {
      mockExternalCompanyRepo.findById.mockResolvedValue(null);

      await expect(externalService.deleteExternalCompany(999))
        .rejects
        .toThrow(NotFoundError);
    });

    it("should throw error if company has maintainers", async () => {
      const mockCompany = {
        id: 1,
        name: "Enel X",
        maintainers: [
          {
            id: 501,
            first_name: "Marco",
            last_name: "Bianchi",
          },
        ],
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);

      await expect(externalService.deleteExternalCompany(1))
        .rejects
        .toThrow(BadRequestError);
    });

    it("should throw error if delete operation fails", async () => {
      const mockCompany = {
        id: 1,
        name: "Test Company",
        maintainers: [],
      };

      mockExternalCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockExternalCompanyRepo.deleteById.mockResolvedValue(false);

      await expect(externalService.deleteExternalCompany(1))
        .rejects
        .toThrow(BadRequestError);
    });
  });
});
