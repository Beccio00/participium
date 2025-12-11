import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import { createUserInDatabase } from "../../helpers/testUtils";
import { ReportCategory } from "../../../../shared/ReportTypes";

const app = createApp();

describe("Report Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/reports - Create Report", () => {
    describe("Success scenarios", () => {
      it("should successfully create a report with valid data", async () => {
        // Arrange - Create a citizen user
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        // Login to get session
        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        // Act
        const response = await agent
          .post("/api/reports")
          .field("title", "Broken street light")
          .field("description", "The street light on Main St is not working")
          .field("category", "PUBLIC_LIGHTING")
          .field("latitude", "45.0703")
          .field("longitude", "7.6869")
          .field("isAnonymous", "false")
          .attach("photos", Buffer.from("fake-image"), "photo1.jpg");

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty(
          "message",
          "Report created successfully"
        );
        expect(response.body.report).toHaveProperty("id");
        expect(typeof response.body.report.id).toBe("number");
      });

      it("should create an anonymous report", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
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
          .post("/api/reports")
          .field("title", "Pothole on road")
          .field("description", "Large pothole needs fixing")
          .field("category", "ROADS_URBAN_FURNISHINGS")
          .field("latitude", "45.0704")
          .field("longitude", "7.687")
          .field("isAnonymous", "true")
          .attach("photos", Buffer.from("fake-image"), "pothole.jpg");

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.report).toHaveProperty("id");
      });

      it("should create report with multiple photos", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
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
          .post("/api/reports")
          .field("title", "Damaged playground")
          .field("description", "Playground equipment is damaged and unsafe")
          .field("category", "PUBLIC_GREEN_AREAS_PLAYGROUNDS")
          .field("latitude", "45.0705")
          .field("longitude", "7.6871")
          .field("isAnonymous", "false")
          .attach("photos", Buffer.from("fake-image-1"), "photo1.jpg")
          .attach("photos", Buffer.from("fake-image-2"), "photo2.jpg")
          .attach("photos", Buffer.from("fake-image-3"), "photo3.jpg");

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.report).toHaveProperty("id");
      });

      it("should create report with all valid categories", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const categories: ReportCategory[] = [
          ReportCategory.WATER_SUPPLY_DRINKING_WATER,
          ReportCategory.ARCHITECTURAL_BARRIERS,
          ReportCategory.SEWER_SYSTEM,
          ReportCategory.PUBLIC_LIGHTING,
          ReportCategory.WASTE,
          ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
          ReportCategory.ROADS_URBAN_FURNISHINGS,
          ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS,
          ReportCategory.OTHER,
        ];

        // Act & Assert - Test each category
        for (const category of categories) {
          const response = await agent
            .post("/api/reports")
            .field("title", `Test report for ${category}`)
            .field("description", `Testing category: ${category}`)
            .field("category", category)
            .field("latitude", "45.0703")
            .field("longitude", "7.6869")
            .field("isAnonymous", "false")
            .attach("photos", Buffer.from("fake-image"), "test.jpg");
          expect(response.status).toBe(201);
          expect(response.body.report).toHaveProperty("id");
        }
      });
    });

    describe("Validation - Missing required fields", () => {
      it("should return 400 when title is missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          // title: missing
          description: "Test description",
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
        expect(response.body.message).toContain("Missing required fields");
      });

      it("should return 400 when description is missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          title: "Test report",
          // description: missing
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });

      it("should return 400 when category is missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          title: "Test report",
          description: "Test description",
          // category: missing
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });

      it("should return 400 when latitude is missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          title: "Test report",
          description: "Test description",
          category: "PUBLIC_LIGHTING" as ReportCategory,
          // latitude: missing
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });

      it("should return 400 when longitude is missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          title: "Test report",
          description: "Test description",
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          // longitude: missing
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });

      it("should return 400 when photos are missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          title: "Test report",
          description: "Test description",
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          // photos: missing
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });

      it("should return 400 when multiple fields are missing", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        const reportData = {
          // title: missing
          // description: missing
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          // photos: missing
        };

        // Act
        const response = await agent.post("/api/reports").send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "BadRequest");
      });
    });

    describe("Authentication scenarios", () => {
      it("should return 401 when not logged in", async () => {
        // Arrange
        const reportData = {
          title: "Test report",
          description: "Test description",
          category: "PUBLIC_LIGHTING" as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
            },
          ],
        };

        // Act - No login, direct request
        const response = await request(app)
          .post("/api/reports")
          .send(reportData);

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Unauthorized");
      });
    });

    describe("Edge cases", () => {
      it("should handle latitude and longitude as 0", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
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
          .post("/api/reports")
          .field("title", "Test report at 0,0")
          .field("description", "Testing edge case")
          .field("category", "OTHER")
          .field("latitude", "0")
          .field("longitude", "0")
          .field("isAnonymous", "false")
          .attach("photos", Buffer.from("fake-image"), "photo.jpg");

        // Assert - (0,0) is not in Turin boundaries
        expect(response.status).toBe(422);
        expect(response.body.message).toContain("boundaries");
      });

      it("should handle negative latitude and longitude", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
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
          .post("/api/reports")
          .field("title", "Test report")
          .field("description", "Testing negative coordinates")
          .field("category", "OTHER")
          .field("latitude", "-45.0703")
          .field("longitude", "-7.6869")
          .field("isAnonymous", "false")
          .attach("photos", Buffer.from("fake-image"), "photo.jpg");

        // Assert - Negative coords not in Turin
        expect(response.status).toBe(422);
        expect(response.body.message).toContain("boundaries");
      });
    });
  });

  describe("GET /api/reports - Get Reports", () => {
    describe("Success scenarios", () => {
      it("should return empty array when no approved reports exist", async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
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
        const response = await agent.get("/api/reports");

        // Assert
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it("should not return pending approval reports", async () => {
        // Arrange - Create a report (which will be in PENDING_APPROVAL status)
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: "Citizen123!",
          role: "CITIZEN",
        });

        const agent = request.agent(app);
        await agent
          .post("/api/session")
          .send({ email: citizenEmail, password: "Citizen123!" })
          .expect(200);

        await agent
          .post("/api/reports")
          .field("title", "Pending report")
          .field("description", "This should not be visible")
          .field("category", "PUBLIC_LIGHTING")
          .field("latitude", "45.0703")
          .field("longitude", "7.6869")
          .field("isAnonymous", "false")
          .attach("photos", Buffer.from("fake-image"), "photo.jpg")
          .expect(201);

        // Act - Get reports
        const response = await agent.get("/api/reports");

        // Assert - Should be empty because report is in PENDING_APPROVAL status
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });

    describe("Authentication scenarios", () => {
      it("should allow unauthenticated access to public reports", async () => {
        // Act - No login, direct request
        const response = await request(app).get("/api/reports");

        // Assert - Public endpoint should return 200
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});
