import {
  toExternalCompanyDTO,
  toExternalMaintainerDTO,
  toExternalHandlerDTO,
  ExternalCompanyDTO,
  ExternalMaintainerDTO,
  ExternalHandlerDTO,
} from "../../../src/interfaces/ExternalsDTO";
import { ReportCategory } from "../../../../shared/ReportTypes";
import { Role } from "../../../../shared/RoleTypes";

describe("ExternalsDTO Unit Tests - PT25", () => {
  // =========================
  // toExternalCompanyDTO TESTS
  // =========================

  describe("toExternalCompanyDTO", () => {
    it("should convert company entity to DTO", () => {
      const mockCompany = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
        maintainers: [],
        reports: [],
      };

      const result = toExternalCompanyDTO(mockCompany);

      expect(result).toEqual({
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      });
    });

    it("should handle company with multiple categories", () => {
      const mockCompany = {
        id: 2,
        name: "Multi Service",
        categories: [ReportCategory.PUBLIC_LIGHTING, ReportCategory.ROADS_URBAN_FURNISHINGS],
        platformAccess: false,
      };

      const result = toExternalCompanyDTO(mockCompany);

      expect(result.categories).toHaveLength(2);
      expect(result.categories).toContain(ReportCategory.PUBLIC_LIGHTING);
      expect(result.categories).toContain(ReportCategory.ROADS_URBAN_FURNISHINGS);
    });

    it("should handle company without platform access", () => {
      const mockCompany = {
        id: 3,
        name: "AMIAT",
        categories: [ReportCategory.WASTE],
        platformAccess: false,
      };

      const result = toExternalCompanyDTO(mockCompany);

      expect(result.platformAccess).toBe(false);
    });
  });

  // =========================
  // toExternalMaintainerDTO TESTS
  // =========================

  describe("toExternalMaintainerDTO", () => {
    it("should convert maintainer user to DTO with company", () => {
      const mockUser = {
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

      const result = toExternalMaintainerDTO(mockUser);

      expect(result).toEqual({
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
      });
    });

    it("should return null if user is null", () => {
      const result = toExternalMaintainerDTO(null);

      expect(result).toBeNull();
    });

    it("should return null if user has no externalCompany", () => {
      const mockUser = {
        id: 501,
        first_name: "Marco",
        last_name: "Bianchi",
        email: "marco@enelx.com",
        role: Role.EXTERNAL_MAINTAINER,
        externalCompany: null,
      };

      const result = toExternalMaintainerDTO(mockUser);

      expect(result).toBeNull();
    });

    it("should return null if user is undefined", () => {
      const result = toExternalMaintainerDTO(undefined);

      expect(result).toBeNull();
    });
  });

  // =========================
  // toExternalHandlerDTO TESTS (PT25 - Report Assignment)
  // =========================

  describe("toExternalHandlerDTO", () => {
    it("should return user handler when report assigned to external maintainer", () => {
      const mockReport = {
        id: 1,
        externalMaintainer: {
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
        externalCompany: null,
      };

      const result = toExternalHandlerDTO(mockReport);

      expect(result).toEqual({
        type: "user",
        user: {
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
      });
    });

    it("should return company handler when report assigned to external company only", () => {
      const mockReport = {
        id: 2,
        externalMaintainer: null,
        externalCompany: {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
        },
      };

      const result = toExternalHandlerDTO(mockReport);

      expect(result).toEqual({
        type: "company",
        company: {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
        },
      });
    });

    it("should prioritize user handler over company when both exist", () => {
      const mockReport = {
        id: 3,
        externalMaintainer: {
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
        externalCompany: {
          id: 1,
          name: "Enel X",
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        },
      };

      const result = toExternalHandlerDTO(mockReport);

      expect(result?.type).toBe("user");
    });

    it("should return null when no external assignment exists", () => {
      const mockReport = {
        id: 4,
        externalMaintainer: null,
        externalCompany: null,
      };

      const result = toExternalHandlerDTO(mockReport);

      expect(result).toBeNull();
    });

    it("should return null when maintainer has no company", () => {
      const mockReport = {
        id: 5,
        externalMaintainer: {
          id: 501,
          first_name: "Marco",
          last_name: "Bianchi",
          email: "marco@enelx.com",
          role: Role.EXTERNAL_MAINTAINER,
          externalCompany: null,
        },
        externalCompany: null,
      };

      const result = toExternalHandlerDTO(mockReport);

      expect(result).toBeNull();
    });
  });

  // =========================
  // TYPE SAFETY TESTS
  // =========================

  describe("Type Safety", () => {
    it("should produce ExternalCompanyDTO type", () => {
      const mockCompany = {
        id: 1,
        name: "Enel X",
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const result: ExternalCompanyDTO = toExternalCompanyDTO(mockCompany);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("platformAccess");
    });

    it("should produce ExternalMaintainerDTO type", () => {
      const mockUser = {
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

      const result: ExternalMaintainerDTO | null = toExternalMaintainerDTO(mockUser);

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("firstName");
        expect(result).toHaveProperty("lastName");
        expect(result).toHaveProperty("email");
        expect(result).toHaveProperty("role");
        expect(result).toHaveProperty("company");
      }
    });

    it("should produce ExternalHandlerDTO type with user", () => {
      const mockReport = {
        id: 1,
        externalMaintainer: {
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
      };

      const result: ExternalHandlerDTO | null = toExternalHandlerDTO(mockReport);

      if (result && result.type === "user") {
        expect(result.user).toHaveProperty("id");
        expect(result.user).toHaveProperty("company");
      }
    });

    it("should produce ExternalHandlerDTO type with company", () => {
      const mockReport = {
        id: 2,
        externalCompany: {
          id: 2,
          name: "AMIAT",
          categories: [ReportCategory.WASTE],
          platformAccess: false,
        },
      };

      const result: ExternalHandlerDTO | null = toExternalHandlerDTO(mockReport);

      if (result && result.type === "company") {
        expect(result.company).toHaveProperty("id");
        expect(result.company).toHaveProperty("name");
      }
    });
  });
});
