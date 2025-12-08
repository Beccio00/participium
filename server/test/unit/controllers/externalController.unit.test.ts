import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../../src/utils/errors";

// Mock the service
const mockCreateExternalCompany = jest.fn();
const mockListExternalCompanies = jest.fn();
const mockCreateExternalMaintainer = jest.fn();
const mockGetExternalCompaniesWithAccess = jest.fn();
const mockDeleteExternalCompany = jest.fn();
const mockGetAssignableExternals = jest.fn();
const mockAssignReportToExternal = jest.fn();
const mockGetAllExternalMaintainers = jest.fn();
const mockGetExternalMaintainerById = jest.fn();
const mockDeleteExternalMaintainer = jest.fn();

jest.mock("../../../src/services/externalService", () => ({
  createExternalCompany: mockCreateExternalCompany,
  listExternalCompanies: mockListExternalCompanies,
  createExternalMaintainer: mockCreateExternalMaintainer,
  getExternalCompaniesWithAccess: mockGetExternalCompaniesWithAccess,
  deleteExternalCompany: mockDeleteExternalCompany,
  getAssignableExternals: mockGetAssignableExternals,
  assignReportToExternal: mockAssignReportToExternal,
  getAllExternalMaintainers: mockGetAllExternalMaintainers,
  getExternalMaintainerById: mockGetExternalMaintainerById,
  deleteExternalMaintainer: mockDeleteExternalMaintainer,
}));

import {
  createExternalCompanyController,
  listExternalCompaniesController,
  createExternalMaintainerController,
  getExternalCompaniesWithAccessController,
  deleteExternalCompanyController,
  listExternalMaintainersController,
  getExternalMaintainerController,
  deleteExternalMaintainerController,
  getAssignableExternals,
  assignReportToExternal,
} from "../../../src/controllers/externalController";
import { ReportCategory } from "../../../../shared/ReportTypes";
import { Role } from "../../../../shared/RoleTypes";

describe("External Controller Unit Tests - PT25", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let sendMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
      send: sendMock,
    });

    mockReq = {
      body: {},
      params: {},
      user: { id: 1 },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  // =========================
  // EXTERNAL COMPANY CONTROLLER TESTS
  // =========================

  describe("createExternalCompanyController", () => {
    it("should create external company successfully", async () => {
      const companyData = {
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const mockResult = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      mockReq.body = companyData;
      mockCreateExternalCompany.mockResolvedValue(mockResult);

      await createExternalCompanyController(mockReq as Request, mockRes as Response);

      expect(mockCreateExternalCompany).toHaveBeenCalledWith(companyData);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it("should pass validation errors from service", async () => {
      mockReq.body = {
        name: "",
        categories: [],
        platformAccess: true,
      };

      mockCreateExternalCompany.mockRejectedValue(new BadRequestError("Company name is required"));

      await expect(
        createExternalCompanyController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("listExternalCompaniesController", () => {
    it("should return all external companies", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          users: [
            {
              id: 501,
              firstName: "Marco",
              lastName: "Bianchi",
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
          users: null,
        },
      ];

      mockListExternalCompanies.mockResolvedValue(mockCompanies);

      await listExternalCompaniesController(mockReq as Request, mockRes as Response);

      expect(mockListExternalCompanies).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCompanies);
    });
  });

  describe("getExternalCompaniesWithAccessController", () => {
    it("should return companies with platform access", async () => {
      const mockCompanies = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
          users: [],
        },
      ];

      mockGetExternalCompaniesWithAccess.mockResolvedValue(mockCompanies);

      await getExternalCompaniesWithAccessController(mockReq as Request, mockRes as Response);

      expect(mockGetExternalCompaniesWithAccess).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCompanies);
    });
  });

  describe("deleteExternalCompanyController", () => {
    it("should delete external company successfully", async () => {
      mockReq.params = { id: "1" };
      mockDeleteExternalCompany.mockResolvedValue(undefined);

      await deleteExternalCompanyController(mockReq as Request, mockRes as Response);

      expect(mockDeleteExternalCompany).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should throw error for invalid company ID", async () => {
      mockReq.params = { id: "invalid" };

      await expect(
        deleteExternalCompanyController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if company not found", async () => {
      mockReq.params = { id: "999" };
      mockDeleteExternalCompany.mockRejectedValue(new NotFoundError("External company not found"));

      await expect(
        deleteExternalCompanyController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // =========================
  // EXTERNAL MAINTAINER CONTROLLER TESTS
  // =========================

  describe("createExternalMaintainerController", () => {
    it("should create external maintainer successfully", async () => {
      const maintainerData = {
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco.bianchi@enelx.com",
        password: "External123!",
        externalCompanyId: 1,
      };

      const mockResult = {
        id: 501,
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco.bianchi@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
        company: {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        },
      };

      mockReq.body = maintainerData;
      mockCreateExternalMaintainer.mockResolvedValue(mockResult);

      await createExternalMaintainerController(mockReq as Request, mockRes as Response);

      expect(mockCreateExternalMaintainer).toHaveBeenCalledWith(maintainerData);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("listExternalMaintainersController", () => {
    it("should return all external maintainers", async () => {
      const mockMaintainers = [
        {
          id: 501,
          firstName: "Marco",
          lastName: "Bianchi",
          email: "marco@enelx.com",
          role: Role.EXTERNAL_MAINTAINER,
          company: {
            id: 1,
            name: "Enel X",
            categories: [ReportCategory.PUBLIC_LIGHTING],
            platformAccess: true,
          },
        },
      ];

      mockGetAllExternalMaintainers.mockResolvedValue(mockMaintainers);

      await listExternalMaintainersController(mockReq as Request, mockRes as Response);

      expect(mockGetAllExternalMaintainers).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockMaintainers);
    });
  });

  describe("getExternalMaintainerController", () => {
    it("should return external maintainer by ID", async () => {
      const mockMaintainer = {
        id: 501,
        firstName: "Marco",
        lastName: "Bianchi",
        email: "marco@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
        company: {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        },
      };

      mockReq.params = { id: "501" };
      mockGetExternalMaintainerById.mockResolvedValue(mockMaintainer);

      await getExternalMaintainerController(mockReq as Request, mockRes as Response);

      expect(mockGetExternalMaintainerById).toHaveBeenCalledWith(501);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockMaintainer);
    });

    it("should throw error for invalid maintainer ID", async () => {
      mockReq.params = { id: "invalid" };

      await expect(
        getExternalMaintainerController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if maintainer not found", async () => {
      mockReq.params = { id: "999" };
      mockGetExternalMaintainerById.mockResolvedValue(null);

      await expect(
        getExternalMaintainerController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteExternalMaintainerController", () => {
    it("should delete external maintainer successfully", async () => {
      mockReq.params = { id: "501" };
      mockDeleteExternalMaintainer.mockResolvedValue(true);

      await deleteExternalMaintainerController(mockReq as Request, mockRes as Response);

      expect(mockDeleteExternalMaintainer).toHaveBeenCalledWith(501);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should throw error for invalid maintainer ID", async () => {
      mockReq.params = { id: "invalid" };

      await expect(
        deleteExternalMaintainerController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if maintainer not found", async () => {
      mockReq.params = { id: "999" };
      mockDeleteExternalMaintainer.mockResolvedValue(false);

      await expect(
        deleteExternalMaintainerController(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // =========================
  // REPORT ASSIGNMENT CONTROLLER TESTS (PT25)
  // =========================

  describe("getAssignableExternals", () => {
    it("should return assignable external companies for report", async () => {
      const mockResult = [
        {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          hasPlatformAccess: true,
          users: [
            {
              id: 501,
              firstName: "Marco",
              lastName: "Bianchi",
              email: "marco@enelx.com",
              role: Role.EXTERNAL_MAINTAINER,
            },
          ],
        },
      ];

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockGetAssignableExternals.mockResolvedValue(mockResult);

      await getAssignableExternals(mockReq as Request, mockRes as Response);

      expect(mockGetAssignableExternals).toHaveBeenCalledWith(1, 2);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it("should throw error for invalid report ID", async () => {
      mockReq.params = { reportId: "invalid" };

      await expect(
        getAssignableExternals(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("assignReportToExternal", () => {
    it("should assign report to external maintainer (with platform access)", async () => {
      const mockUpdatedReport = {
        id: 1,
        title: "Broken light",
        category: ReportCategory.PUBLIC_LIGHTING,
        status: "EXTERNAL_ASSIGNED",
      };

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockReq.body = {
        externalCompanyId: 1,
        externalMaintainerId: 501,
      };

      mockAssignReportToExternal.mockResolvedValue(mockUpdatedReport);

      await assignReportToExternal(mockReq as Request, mockRes as Response);

      expect(mockAssignReportToExternal).toHaveBeenCalledWith(1, 2, 1, 501);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Report assigned to external maintainer successfully",
        report: mockUpdatedReport,
      });
    });

    it("should assign report to external company only (no platform access)", async () => {
      const mockUpdatedReport = {
        id: 1,
        title: "Waste issue",
        category: ReportCategory.WASTE,
        status: "EXTERNAL_ASSIGNED",
      };

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockReq.body = {
        externalCompanyId: 2,
        externalMaintainerId: null,
      };

      mockAssignReportToExternal.mockResolvedValue(mockUpdatedReport);

      await assignReportToExternal(mockReq as Request, mockRes as Response);

      expect(mockAssignReportToExternal).toHaveBeenCalledWith(1, 2, 2, null);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Report assigned to external company successfully",
        report: mockUpdatedReport,
      });
    });

    it("should throw error for invalid report ID", async () => {
      mockReq.params = { reportId: "invalid" };
      mockReq.body = {
        externalCompanyId: 1,
        externalMaintainerId: 501,
      };

      await expect(
        assignReportToExternal(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if externalCompanyId is missing", async () => {
      mockReq.params = { reportId: "1" };
      mockReq.body = {
        externalMaintainerId: 501,
      };

      await expect(
        assignReportToExternal(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if externalCompanyId is invalid", async () => {
      mockReq.params = { reportId: "1" };
      mockReq.body = {
        externalCompanyId: "invalid",
        externalMaintainerId: 501,
      };

      await expect(
        assignReportToExternal(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle undefined externalMaintainerId", async () => {
      const mockUpdatedReport = {
        id: 1,
        title: "Waste issue",
        category: ReportCategory.WASTE,
        status: "EXTERNAL_ASSIGNED",
      };

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockReq.body = {
        externalCompanyId: 2,
        externalMaintainerId: undefined,
      };

      mockAssignReportToExternal.mockResolvedValue(mockUpdatedReport);

      await assignReportToExternal(mockReq as Request, mockRes as Response);

      expect(mockAssignReportToExternal).toHaveBeenCalledWith(1, 2, 2, null);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should handle null externalMaintainerId", async () => {
      const mockUpdatedReport = {
        id: 1,
        title: "Waste issue",
        category: ReportCategory.WASTE,
        status: "EXTERNAL_ASSIGNED",
      };

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockReq.body = {
        externalCompanyId: 2,
        externalMaintainerId: null,
      };

      mockAssignReportToExternal.mockResolvedValue(mockUpdatedReport);

      await assignReportToExternal(mockReq as Request, mockRes as Response);

      expect(mockAssignReportToExternal).toHaveBeenCalledWith(1, 2, 2, null);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should convert string externalMaintainerId to number", async () => {
      const mockUpdatedReport = {
        id: 1,
        title: "Light issue",
        category: ReportCategory.PUBLIC_LIGHTING,
        status: "EXTERNAL_ASSIGNED",
      };

      mockReq.params = { reportId: "1" };
      mockReq.user = { id: 2 };
      mockReq.body = {
        externalCompanyId: "1",
        externalMaintainerId: "501",
      };

      mockAssignReportToExternal.mockResolvedValue(mockUpdatedReport);

      await assignReportToExternal(mockReq as Request, mockRes as Response);

      expect(mockAssignReportToExternal).toHaveBeenCalledWith(1, 2, 1, 501);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Report assigned to external maintainer successfully",
        report: mockUpdatedReport,
      });
    });
  });
});
