// Mock email service for Story 27 compatibility (email verification)
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import { createApp } from "../../src/app";
import { cleanDatabase, disconnectDatabase, AppDataSource } from "../helpers/testSetup";
import { createUserInDatabase } from "../helpers/testUtils";
import { User } from "../../src/entities/User";

const app = createApp();


describe("Administrator Managing Municipality Users", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("Complete Admin Workflow: Login → Create → List → Get → Delete", () => {
    it("should complete the full municipality user management lifecycle", async () => {

      // Step 1: Create admin via API
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const preAgent = request.agent(app);
      await preAgent
        .post("/api/citizen/signup")
        .send({
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: adminEmail },
        { role: "ADMINISTRATOR" as any, isVerified: true }
      );
      // Crea un nuovo agent e fai login per ottenere la sessione aggiornata
      const agent = request.agent(app);
      const loginResponse = await agent
        .post("/api/session")
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      expect(loginResponse.body.user.role).toBe("ADMINISTRATOR");

      // Step 2: Create Municipality User (PUBLIC_RELATIONS)
      const newMunicipalityUser = {
        firstName: "John",
        lastName: "PR",
        email: `pr${Date.now()}@municipality.gov`,
        password: "PRPass123!",
        role: "PUBLIC_RELATIONS",
      };

      const createResponse = await agent
        .post("/api/admin/municipality-users")
        .send(newMunicipalityUser)
        .expect(201);

      expect(createResponse.body).toHaveProperty("id");
      expect(createResponse.body.email).toBe(newMunicipalityUser.email);
      expect(createResponse.body.role).toBe("PUBLIC_RELATIONS");
      const userId = createResponse.body.id;

      // Step 3: List All Municipality Users
      const listResponse = await agent
        .get("/api/admin/municipality-users")
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);

      const createdUser = listResponse.body.find((u: any) => u.id === userId);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(newMunicipalityUser.email);


      await agent.delete(`/api/admin/municipality-users/${userId}`).expect(204); // 204 No Content is correct for successful deletion

      await agent.get(`/api/admin/municipality-users/${userId}`).expect(404);

    });

    it("should create and manage multiple municipality users with different roles", async () => {
      // Setup: Create admin via API, promote, login
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const preAgent = request.agent(app);
      await preAgent
        .post("/api/citizen/signup")
        .send({
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: adminEmail },
        { role: "ADMINISTRATOR" as any, isVerified: true }
      );
      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Create users with different roles
      const roles = ["PUBLIC_RELATIONS", "MUNICIPAL_BUILDING_MAINTENANCE"];
      const createdUserIds: number[] = [];

      for (const role of roles) {
        const userData = {
          firstName: "Test",
          lastName: role,
          email: `${role.toLowerCase()}${Date.now()}@municipality.gov`,
          password: "Pass123!",
          role: role,
        };

        const response = await agent
          .post("/api/admin/municipality-users")
          .send(userData)
          .expect(201);

        expect(response.body.role).toBe(role);
        createdUserIds.push(response.body.id);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Verify all users are in the list
      const listResponse = await agent
        .get("/api/admin/municipality-users")
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(roles.length);

      for (const userId of createdUserIds) {
        const user = listResponse.body.find((u: any) => u.id === userId);
        expect(user).toBeDefined();
      }

    });
  });

  describe("Authorization and Access Control", () => {
    it("should prevent non-admin users from accessing admin endpoints", async () => {
      // Create a regular citizen user
      const citizenEmail = `citizen${Date.now()}@example.com`;
      const citizenPassword = "CitizenPass123!";

      await createUserInDatabase({
        email: citizenEmail,
        firstName: "Regular",
        lastName: "Citizen",
        password: citizenPassword,
        role: "CITIZEN",
      });

      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: citizenEmail, password: citizenPassword })
        .expect(200);

      // Try to access admin endpoints
      await agent.get("/api/admin/municipality-users").expect(403);

      await agent
        .post("/api/admin/municipality-users")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          password: "Pass123!",
          role: "PUBLIC_RELATIONS",
        })
        .expect(403);

    });

    it("should require authentication for admin endpoints", async () => {
      // Try to access without login
      await request(app).get("/api/admin/municipality-users").expect(401);

      await request(app)
        .post("/api/admin/municipality-users")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          password: "Pass123!",
          role: "PUBLIC_RELATIONS",
        })
        .expect(401);

    });
  });

  describe("Data Validation", () => {
    let adminAgent: any;

    beforeEach(async () => {
      // Crea admin via signup API, promuovi via DB, login con nuovo agent
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const preAgent = request.agent(app);
      await preAgent
        .post("/api/citizen/signup")
        .send({
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: adminEmail },
        { role: "ADMINISTRATOR" as any, isVerified: true }
      );
      adminAgent = request.agent(app);
      await adminAgent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
    });

    it("should reject creation with missing required fields", async () => {
      const incompleteData = {
        firstName: "John",
        // Missing lastName, email, password, role
      };

      const response = await adminAgent
        .post("/api/admin/municipality-users")
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject creation with invalid role", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email: `test${Date.now()}@municipality.gov`,
        password: "Pass123!",
        role: "INVALID_ROLE",
      };

      const response = await adminAgent
        .post("/api/admin/municipality-users")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject duplicate email addresses", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: `duplicate${Date.now()}@municipality.gov`,
        password: "Pass123!",
        role: "PUBLIC_RELATIONS",
      };

      // First creation should succeed
      await adminAgent
        .post("/api/admin/municipality-users")
        .send(userData)
        .expect(201);

      // Second creation with same email should fail
      const response = await adminAgent
        .post("/api/admin/municipality-users")
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject deletion of non-existent user", async () => {
      const nonExistentId = 999999;

      const response = await adminAgent
        .delete(`/api/admin/municipality-users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Role Management", () => {
    let adminAgent: any;

    beforeEach(async () => {
      // Crea admin via signup API, promuovi via DB, login con nuovo agent
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const preAgent = request.agent(app);
      await preAgent
        .post("/api/citizen/signup")
        .send({
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: adminEmail },
        { role: "ADMINISTRATOR" as any, isVerified: true }
      );
      adminAgent = request.agent(app);
      await adminAgent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
    });

    it("should retrieve list of available roles", async () => {
      const response = await adminAgent.get("/api/admin/roles").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain("PUBLIC_RELATIONS");
      expect(response.body).toContain("MUNICIPAL_BUILDING_MAINTENANCE");
      // ADMINISTRATOR and CITIZEN are not in municipality roles list
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it("should only allow creating municipality roles (not CITIZEN)", async () => {
      const citizenData = {
        firstName: "Test",
        lastName: "Citizen",
        email: `testcitizen${Date.now()}@example.com`,
        password: "Pass123!",
        role: "CITIZEN",
      };

      const response = await adminAgent
        .post("/api/admin/municipality-users")
        .send(citizenData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
