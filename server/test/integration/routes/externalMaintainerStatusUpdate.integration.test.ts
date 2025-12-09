// this is test for story 25 - External Maintainer Report Status Update Integration Tests
//npm test -- externalMaintainerStatusUpdate.integration.test.ts --verbose
import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import { createUserInDatabase } from "../../helpers/testUtils";
import { AppDataSource } from "../../../src/utils/AppDataSource";
import { Report } from "../../../src/entities/Report";
import { ReportPhoto } from "../../../src/entities/ReportPhoto";
import { ExternalCompany } from "../../../src/entities/ExternalCompany";
import { User } from "../../../src/entities/User";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";

const app = createApp();

describe("Story PT25 - External Maintainer Report Status Update Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  /**
   * Helper function to create an external company with platform access
   */
  async function createExternalCompany(platformAccess: boolean = true) {
    const companyRepo = AppDataSource.getRepository(ExternalCompany);
    const company = companyRepo.create({
      name: `Test Company ${Date.now()}`,
      categories: [ReportCategory.PUBLIC_LIGHTING],
      platformAccess: platformAccess,
    });
    return await companyRepo.save(company);
  }

  /**
   * Helper function to create an external maintainer user
   */
  async function createExternalMaintainer(companyId: number) {
    const email = `external-${Date.now()}@test.com`;
    const user = await createUserInDatabase({
      email,
      password: "External123!",
      role: "EXTERNAL_MAINTAINER",
      first_name: "External",
      last_name: "Maintainer",
    });
    
    // Link user to external company
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.update(user.id, { externalCompanyId: companyId });
    
    return { ...user, email, password: "External123!" };
  }

  /**
   * Helper function to create a report assigned to an external maintainer
   */
  async function createReportAssignedToExternal(citizenId: number, externalMaintainerId: number) {
    const reportRepo = AppDataSource.getRepository(Report);
    const photoRepo = AppDataSource.getRepository(ReportPhoto);
    
    const report = reportRepo.create({
      title: "Test Report for External",
      description: "This report is assigned to external maintainer",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0703,
      longitude: 7.6869,
      address: "Via Roma, Turin",
      isAnonymous: false,
      status: ReportStatus.EXTERNAL_ASSIGNED,
      userId: citizenId,
      externalMaintainerId: externalMaintainerId,
      assignedOfficerId: null,
    });
    const savedReport = await reportRepo.save(report);

    // Add a photo
    const photo = photoRepo.create({
      url: "https://example.com/photo1.jpg",
      filename: "photo1.jpg",
      reportId: savedReport.id,
    });
    await photoRepo.save(photo);

    return savedReport;
  }

  /**
   * Helper function to create a report assigned to a technical officer
   */
  async function createReportAssignedToTechnical(citizenId: number, technicalId: number) {
    const reportRepo = AppDataSource.getRepository(Report);
    const photoRepo = AppDataSource.getRepository(ReportPhoto);
    
    const report = reportRepo.create({
      title: "Test Report for Technical",
      description: "This report is assigned to technical officer",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0703,
      longitude: 7.6869,
      address: "Via Test, Turin",
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      userId: citizenId,
      assignedOfficerId: technicalId,
    });
    const savedReport = await reportRepo.save(report);

    // Add a photo
    const photo = photoRepo.create({
      url: "https://example.com/photo2.jpg",
      filename: "photo2.jpg",
      reportId: savedReport.id,
    });
    await photoRepo.save(photo);

    return savedReport;
  }

  // =========================
  // SUCCESS SCENARIOS
  // =========================

  describe("Success Scenarios - External Maintainer Status Updates", () => {
    it("should allow external maintainer to update report status to IN_PROGRESS", async () => {
      // Arrange - Create external company and maintainer
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      // Create citizen
      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report assigned to external maintainer
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      // Login as external maintainer
      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update status to IN_PROGRESS
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Report status updated successfully");
      expect(response.body.report).toHaveProperty("status", "IN_PROGRESS");
      expect(response.body.report).toHaveProperty("id", report.id);

      // Verify in database
      const reportRepo = AppDataSource.getRepository(Report);
      const updatedReport = await reportRepo.findOne({ where: { id: report.id } });
      expect(updatedReport?.status).toBe("IN_PROGRESS");
    });

    it("should allow external maintainer to update report status to SUSPENDED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update status to SUSPENDED
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "SUSPENDED" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty("status", "SUSPENDED");
    });

    it("should allow external maintainer to update report status to RESOLVED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update status to RESOLVED
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "RESOLVED" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty("status", "RESOLVED");

      // Verify in database
      const reportRepo = AppDataSource.getRepository(Report);
      const updatedReport = await reportRepo.findOne({ where: { id: report.id } });
      expect(updatedReport?.status).toBe("RESOLVED");
    });

    it("should also allow technical officer to update report status", async () => {
      // Arrange - Create technical officer
      const techEmail = `tech-${Date.now()}@test.com`;
      const techUser = await createUserInDatabase({
        email: techEmail,
        password: "Tech123!",
        role: "LOCAL_PUBLIC_SERVICES",
      });

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report assigned to technical officer
      const report = await createReportAssignedToTechnical(citizen.id, techUser.id);

      // Login as technical officer
      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: techEmail, password: "Tech123!" })
        .expect(200);

      // Act - Update status
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty("status", "IN_PROGRESS");
    });
  });

  // =========================
  // AUTHORIZATION TESTS
  // =========================

  describe("Authorization Tests - Access Control", () => {
    it("should return 401 when not authenticated", async () => {
      // Act
      const response = await request(app)
        .patch("/api/reports/1/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 403 when citizen tries to update report status", async () => {
      // Arrange - Create citizen
      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: citizenEmail, password: "Citizen123!" })
        .expect(200);

      // Act
      const response = await agent
        .patch("/api/reports/1/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Forbidden");
    });

    it("should return 403 when public relations officer tries to update report status", async () => {
      // Arrange - Create PR officer
      const prEmail = `pr-${Date.now()}@test.com`;
      await createUserInDatabase({
        email: prEmail,
        password: "PR123!",
        role: "PUBLIC_RELATIONS",
      });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: prEmail, password: "PR123!" })
        .expect(200);

      // Act
      const response = await agent
        .patch("/api/reports/1/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Forbidden");
    });

    it("should return 403 when administrator tries to update report status", async () => {
      // Arrange - Create admin
      const adminEmail = `admin-${Date.now()}@test.com`;
      await createUserInDatabase({
        email: adminEmail,
        password: "Admin123!",
        role: "ADMINISTRATOR",
      });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: "Admin123!" })
        .expect(200);

      // Act
      const response = await agent
        .patch("/api/reports/1/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Forbidden");
    });

    it("should return 403 when external maintainer updates report not assigned to them", async () => {
      // Arrange - Create two external maintainers
      const company = await createExternalCompany(true);
      const externalUser1 = await createExternalMaintainer(company.id);
      const externalUser2 = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report assigned to external maintainer 1
      const report = await createReportAssignedToExternal(citizen.id, externalUser1.id);

      // Login as external maintainer 2
      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser2.email, password: externalUser2.password })
        .expect(200);

      // Act - Try to update report assigned to maintainer 1
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Forbidden");
      expect(response.body.message).toContain("not assigned");
    });
  });

  // =========================
  // VALIDATION TESTS
  // =========================

  describe("Validation Tests - Input Validation", () => {
    it("should return 400 when report ID is invalid", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Use invalid report ID
      const response = await agent
        .patch("/api/reports/invalid/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Bad Request");
    });

    it("should return 404 when report does not exist", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Use non-existent report ID
      const response = await agent
        .patch("/api/reports/999999/status")
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "NotFound");
      expect(response.body.message).toContain("Report not found");
    });

    it("should return 400 when status is missing", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Missing status field
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when status is invalid", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Invalid status value
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "INVALID_STATUS" });

// Assert
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty("error", "Bad Request");
          expect(response.body.message).toContain("must be equal to one of the allowed values");
        });

        it("should return 400 when trying to set PENDING_APPROVAL status", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Try to set PENDING_APPROVAL status
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "PENDING_APPROVAL" });

// Assert
          expect(response.status).toBe(400);
          expect(response.body.message).toContain("must be equal to one of the allowed values");
        });

        it("should return 400 when trying to set ASSIGNED status", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Try to set ASSIGNED status
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "ASSIGNED" });

// Assert
          expect(response.status).toBe(400);
          expect(response.body.message).toContain("must be equal to one of the allowed values");
        });

        it("should return 400 when trying to set REJECTED status", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Try to set REJECTED status
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "REJECTED" });

// Assert
          expect(response.status).toBe(400);
          expect(response.body.message).toContain("must be equal to one of the allowed values");
        });
      });

      // =========================
      // EDGE CASES
  // =========================

  describe("Edge Cases - Special Scenarios", () => {
    it("should handle status transition from EXTERNAL_ASSIGNED to IN_PROGRESS", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Report is in EXTERNAL_ASSIGNED status
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update to IN_PROGRESS
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe("IN_PROGRESS");
    });

    it("should handle status transition from IN_PROGRESS to SUSPENDED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report and set to IN_PROGRESS
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);
      const reportRepo = AppDataSource.getRepository(Report);
      await reportRepo.update(report.id, { status: ReportStatus.IN_PROGRESS });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update to SUSPENDED
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "SUSPENDED" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe("SUSPENDED");
    });

    it("should handle status transition from SUSPENDED to IN_PROGRESS", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report and set to SUSPENDED
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);
      const reportRepo = AppDataSource.getRepository(Report);
      await reportRepo.update(report.id, { status: ReportStatus.SUSPENDED });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update back to IN_PROGRESS
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe("IN_PROGRESS");
    });

    it("should handle status transition from IN_PROGRESS to RESOLVED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report and set to IN_PROGRESS
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);
      const reportRepo = AppDataSource.getRepository(Report);
      await reportRepo.update(report.id, { status: ReportStatus.IN_PROGRESS });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Update to RESOLVED
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "RESOLVED" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe("RESOLVED");
    });

    it("should allow updating already resolved report to IN_PROGRESS (reopen)", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      // Create report and set to RESOLVED
      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);
      const reportRepo = AppDataSource.getRepository(Report);
      await reportRepo.update(report.id, { status: ReportStatus.RESOLVED });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act - Reopen by setting to IN_PROGRESS
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe("IN_PROGRESS");
    });
  });

  // =========================
  // DATA INTEGRITY TESTS
  // =========================

  describe("Data Integrity Tests", () => {
    it("should return updated report with all required fields", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert - Verify response structure
      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty("id");
      expect(response.body.report).toHaveProperty("title");
      expect(response.body.report).toHaveProperty("description");
      expect(response.body.report).toHaveProperty("category");
      expect(response.body.report).toHaveProperty("status", "IN_PROGRESS");
      expect(response.body.report).toHaveProperty("latitude");
      expect(response.body.report).toHaveProperty("longitude");
      expect(response.body.report).toHaveProperty("address");
    });

    it("should preserve other report fields when updating status", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Act
      const response = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });

      // Assert - Other fields should remain unchanged
      expect(response.body.report.title).toBe("Test Report for External");
      expect(response.body.report.description).toBe("This report is assigned to external maintainer");
      expect(response.body.report.category).toBe(ReportCategory.PUBLIC_LIGHTING);
      expect(response.body.report.address).toBe("Via Roma, Turin");
    });
  });

  // =========================
  // WORKFLOW INTEGRATION TESTS
  // =========================

  describe("Workflow Integration Tests", () => {
    it("should complete full workflow: EXTERNAL_ASSIGNED -> IN_PROGRESS -> RESOLVED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Step 1: Update to IN_PROGRESS
      const inProgressResponse = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" });
      expect(inProgressResponse.status).toBe(200);
      expect(inProgressResponse.body.report.status).toBe("IN_PROGRESS");

      // Step 2: Update to RESOLVED
      const resolvedResponse = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "RESOLVED" });
      expect(resolvedResponse.status).toBe(200);
      expect(resolvedResponse.body.report.status).toBe("RESOLVED");

      // Verify final state in database
      const reportRepo = AppDataSource.getRepository(Report);
      const finalReport = await reportRepo.findOne({ where: { id: report.id } });
      expect(finalReport?.status).toBe("RESOLVED");
    });

    it("should handle workflow with suspension: EXTERNAL_ASSIGNED -> IN_PROGRESS -> SUSPENDED -> IN_PROGRESS -> RESOLVED", async () => {
      // Arrange
      const company = await createExternalCompany(true);
      const externalUser = await createExternalMaintainer(company.id);

      const citizenEmail = `citizen-${Date.now()}@test.com`;
      const citizen = await createUserInDatabase({
        email: citizenEmail,
        password: "Citizen123!",
        role: "CITIZEN",
      });

      const report = await createReportAssignedToExternal(citizen.id, externalUser.id);

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: externalUser.email, password: externalUser.password })
        .expect(200);

      // Step 1: Start work
      await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      // Step 2: Suspend work
      await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "SUSPENDED" })
        .expect(200);

      // Step 3: Resume work
      await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      // Step 4: Complete
      const finalResponse = await agent
        .patch(`/api/reports/${report.id}/status`)
        .send({ status: "RESOLVED" });
      
      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.report.status).toBe("RESOLVED");
    });
  });
});

