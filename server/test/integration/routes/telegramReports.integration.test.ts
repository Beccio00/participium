/**
 * Integration Tests for Telegram Report Status Story
 * User Story: As a citizen I want to check my report status through a Telegram bot
 *             So that I can quickly get updates.
 *
 * Endpoints tested:
 * - GET /api/telegram/{telegramId}/reports - Get list of reports for a Telegram user
 * - GET /api/telegram/{telegramId}/reports/{reportId} - Get detailed report status
 */

import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase, AppDataSource } from "../../helpers/testSetup";
import { createUserInDatabase } from "../../helpers/testUtils";
import { Report } from "../../../src/entities/Report";
import { User } from "../../../src/entities/User";
import { ReportPhoto } from "../../../src/entities/ReportPhoto";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";
import { Role } from "../../../../shared/RoleTypes";

const app = createApp();

describe("Telegram Reports Integration Tests - Story: Check report status via Telegram bot", () => {
  const LINKED_TELEGRAM_ID = "123456789";
  const UNLINKED_TELEGRAM_ID = "999999999";

  // Helper function to create a user with linked telegram account
  async function createUserWithTelegram(overrides: {
    email?: string;
    telegramId?: string;
    telegramUsername?: string;
  } = {}): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await createUserInDatabase({
      email: overrides.email || `telegram-user-${Date.now()}@test.com`,
      password: "Test1234!",
      role: Role.CITIZEN,
    });

    // Link telegram account
    await userRepo.update(user.id, {
      telegram_id: overrides.telegramId || LINKED_TELEGRAM_ID,
      telegram_username: overrides.telegramUsername || "testuser",
    });

    return userRepo.findOneOrFail({ where: { id: user.id } });
  }

  // Helper function to create a report for a user
  async function createReportForUser(
    userId: number,
    overrides: Partial<Report> = {}
  ): Promise<Report> {
    const reportRepo = AppDataSource.getRepository(Report);
    const report = reportRepo.create({
      title: overrides.title || "Test Report",
      description: overrides.description || "Test description",
      category: overrides.category || ReportCategory.PUBLIC_LIGHTING,
      latitude: overrides.latitude || 45.0703,
      longitude: overrides.longitude || 7.6869,
      address: overrides.address === null ? null : (overrides.address || "Via Roma 1, Torino"),
      isAnonymous: overrides.isAnonymous ?? false,
      status: overrides.status || ReportStatus.PENDING_APPROVAL,
      userId: userId,
      rejectedReason: overrides.rejectedReason || undefined,
    } as Partial<Report>);
    return reportRepo.save(report);
  }

  // Helper function to add photos to a report
  async function addPhotosToReport(
    reportId: number,
    photoUrls: string[]
  ): Promise<void> {
    const photoRepo = AppDataSource.getRepository(ReportPhoto);
    for (const url of photoUrls) {
      const photo = photoRepo.create({
        reportId,
        url,
        filename: `photo-${Date.now()}.jpg`,
      });
      await photoRepo.save(photo);
    }
  }

  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/telegram/:telegramId/reports - Get user reports list", () => {
    describe("Success scenarios", () => {
      it("should return 200 with list of reports for linked Telegram user", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        await createReportForUser(user.id, {
          title: "Street light broken",
          status: ReportStatus.PENDING_APPROVAL,
        });
        await createReportForUser(user.id, {
          title: "Pothole on road",
          status: ReportStatus.ASSIGNED,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty("reportId");
        expect(response.body[0]).toHaveProperty("title");
        expect(response.body[0]).toHaveProperty("address");
        expect(response.body[0]).toHaveProperty("status");
        expect(response.body[0]).toHaveProperty("createdAt");
      });

      it("should return empty array when user has no reports", async () => {
        // Arrange
        await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      });

      it("should return all reports regardless of status", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        await createReportForUser(user.id, { status: ReportStatus.PENDING_APPROVAL });
        await createReportForUser(user.id, { status: ReportStatus.ASSIGNED });
        await createReportForUser(user.id, { status: ReportStatus.IN_PROGRESS });
        await createReportForUser(user.id, { status: ReportStatus.RESOLVED });
        await createReportForUser(user.id, { status: ReportStatus.REJECTED });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(response.body).toHaveLength(5);
        const statuses = response.body.map((r: any) => r.status);
        expect(statuses).toContain(ReportStatus.PENDING_APPROVAL);
        expect(statuses).toContain(ReportStatus.ASSIGNED);
        expect(statuses).toContain(ReportStatus.IN_PROGRESS);
        expect(statuses).toContain(ReportStatus.RESOLVED);
        expect(statuses).toContain(ReportStatus.REJECTED);
      });

      it("should return correct report summary format", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        await createReportForUser(user.id, {
          title: "Broken street light",
          address: "Via Garibaldi 10, Torino",
          status: ReportStatus.IN_PROGRESS,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(response.body[0]).toMatchObject({
          title: "Broken street light",
          address: "Via Garibaldi 10, Torino",
          status: ReportStatus.IN_PROGRESS,
        });
        expect(typeof response.body[0].reportId).toBe("number");
        expect(typeof response.body[0].createdAt).toBe("string");
        // Verify ISO date format
        expect(new Date(response.body[0].createdAt).toISOString()).toBe(response.body[0].createdAt);
      });

      it("should return 'Address not available' when report has no address", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        await createReportForUser(user.id, { address: null });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(response.body[0].address).toBe("Address not available");
      });

      it("should only return reports belonging to the telegram user", async () => {
        // Arrange
        const user1 = await createUserWithTelegram({
          telegramId: LINKED_TELEGRAM_ID,
          email: "user1@test.com",
        });
        const user2 = await createUserWithTelegram({
          telegramId: "987654321",
          email: "user2@test.com",
        });

        await createReportForUser(user1.id, { title: "User1 Report" });
        await createReportForUser(user2.id, { title: "User2 Report" });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
          .expect(200);

        // Assert
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe("User1 Report");
      });
    });

    describe("Error scenarios", () => {
      it("should return 404 when Telegram ID is not linked to any account", async () => {
        // Act
        const response = await request(app)
          .get(`/api/telegram/${UNLINKED_TELEGRAM_ID}/reports`)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty("error", "NotFound");
        expect(response.body.message).toContain("No account linked to this Telegram ID");
      });

      it("should return 404 for user with no telegram linked (only email account)", async () => {
        // Arrange - Create user without telegram
        await createUserInDatabase({
          email: "no-telegram@test.com",
          password: "Test1234!",
          role: Role.CITIZEN,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${UNLINKED_TELEGRAM_ID}/reports`)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty("error", "NotFound");
      });
    });
  });

  describe("GET /api/telegram/:telegramId/reports/:reportId - Get report details", () => {
    describe("Success scenarios", () => {
      it("should return 200 with full report details for valid telegramId and reportId", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          title: "Damaged bench",
          description: "The bench in the park is broken",
          category: ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS,
          address: "Parco del Valentino, Torino",
          isAnonymous: false,
          status: ReportStatus.ASSIGNED,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          reportId: report.id,
          title: "Damaged bench",
          description: "The bench in the park is broken",
          category: ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS,
          address: "Parco del Valentino, Torino",
          isAnonymous: false,
          status: ReportStatus.ASSIGNED,
        });
        expect(response.body).toHaveProperty("createdAt");
        expect(response.body).toHaveProperty("photoUrls");
        expect(Array.isArray(response.body.photoUrls)).toBe(true);
      });

      it("should return report with photo URLs when photos exist", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id);
        await addPhotosToReport(report.id, [
          "http://minio/bucket/photo1.jpg",
          "http://minio/bucket/photo2.jpg",
        ]);

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.photoUrls).toHaveLength(2);
        expect(response.body.photoUrls).toContain("http://minio/bucket/photo1.jpg");
        expect(response.body.photoUrls).toContain("http://minio/bucket/photo2.jpg");
      });

      it("should return empty photoUrls array when report has no photos", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id);

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.photoUrls).toEqual([]);
      });

      it("should return rejectedReason when report status is REJECTED", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          status: ReportStatus.REJECTED,
          rejectedReason: "Not within municipality jurisdiction",
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBe(ReportStatus.REJECTED);
        expect(response.body.rejectedReason).toBe("Not within municipality jurisdiction");
      });

      it("should not include rejectedReason when report is not rejected", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          status: ReportStatus.IN_PROGRESS,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.rejectedReason).toBeUndefined();
      });

      it("should return 'Address not available' when report has no address", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, { address: null });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.address).toBe("Address not available");
      });

      it("should return report with isAnonymous true when set", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, { isAnonymous: true });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.isAnonymous).toBe(true);
      });

      it("should return correct ISO date format for createdAt", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id);

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        const createdAt = response.body.createdAt;
        expect(typeof createdAt).toBe("string");
        // Verify it's a valid ISO date string
        expect(new Date(createdAt).toISOString()).toBe(createdAt);
      });
    });

    describe("Error scenarios", () => {
      it("should return 404 when Telegram ID is not linked to any account", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id);

        // Act
        const response = await request(app)
          .get(`/api/telegram/${UNLINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty("error", "NotFound");
        expect(response.body.message).toContain("No account linked to this Telegram ID");
      });

      it("should return 404 when report does not exist", async () => {
        // Arrange
        await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const nonExistentReportId = 99999;

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${nonExistentReportId}`)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty("error", "NotFound");
        expect(response.body.message).toContain("Report not found");
      });

      it("should return 404 when report belongs to another user", async () => {
        // Arrange
        const user1 = await createUserWithTelegram({
          telegramId: LINKED_TELEGRAM_ID,
          email: "user1@test.com",
        });
        const user2 = await createUserWithTelegram({
          telegramId: "987654321",
          email: "user2@test.com",
        });
        const user2Report = await createReportForUser(user2.id, { title: "User2's report" });

        // Act - User1 tries to access User2's report
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${user2Report.id}`)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty("error", "NotFound");
        expect(response.body.message).toContain("Report not found");
      });
    });

    describe("Report status tracking", () => {
      it("should reflect status changes when report is approved", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          status: ReportStatus.ASSIGNED,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBe(ReportStatus.ASSIGNED);
      });

      it("should reflect status IN_PROGRESS when work has started", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          status: ReportStatus.IN_PROGRESS,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBe(ReportStatus.IN_PROGRESS);
      });

      it("should reflect status RESOLVED when issue is fixed", async () => {
        // Arrange
        const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
        const report = await createReportForUser(user.id, {
          status: ReportStatus.RESOLVED,
        });

        // Act
        const response = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBe(ReportStatus.RESOLVED);
      });
    });

    describe("All report categories", () => {
      const categories = Object.values(ReportCategory);

      it.each(categories)(
        "should return correct category %s in report details",
        async (category) => {
          // Arrange
          const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
          const report = await createReportForUser(user.id, { category });

          // Act
          const response = await request(app)
            .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
            .expect(200);

          // Assert
          expect(response.body.category).toBe(category);
        }
      );
    });
  });

  describe("Integration between list and detail endpoints", () => {
    it("should be able to get details for each report in the list", async () => {
      // Arrange
      const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
      await createReportForUser(user.id, { title: "Report 1" });
      await createReportForUser(user.id, { title: "Report 2" });
      await createReportForUser(user.id, { title: "Report 3" });

      // Act - Get list
      const listResponse = await request(app)
        .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports`)
        .expect(200);

      // Assert - Verify we can get details for each report
      expect(listResponse.body).toHaveLength(3);

      for (const reportSummary of listResponse.body) {
        const detailResponse = await request(app)
          .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${reportSummary.reportId}`)
          .expect(200);

        expect(detailResponse.body.reportId).toBe(reportSummary.reportId);
        expect(detailResponse.body.title).toBe(reportSummary.title);
        expect(detailResponse.body.status).toBe(reportSummary.status);
      }
    });

    it("should show updated status when checking report after status change", async () => {
      // Arrange
      const user = await createUserWithTelegram({ telegramId: LINKED_TELEGRAM_ID });
      const report = await createReportForUser(user.id, {
        status: ReportStatus.PENDING_APPROVAL,
      });

      // Initial check
      const initialResponse = await request(app)
        .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
        .expect(200);
      expect(initialResponse.body.status).toBe(ReportStatus.PENDING_APPROVAL);

      // Simulate status change (update directly in DB)
      const reportRepo = AppDataSource.getRepository(Report);
      await reportRepo.update(report.id, { status: ReportStatus.IN_PROGRESS });

      // Act - Check again
      const updatedResponse = await request(app)
        .get(`/api/telegram/${LINKED_TELEGRAM_ID}/reports/${report.id}`)
        .expect(200);

      // Assert - Status should be updated
      expect(updatedResponse.body.status).toBe(ReportStatus.IN_PROGRESS);
    });
  });
});
