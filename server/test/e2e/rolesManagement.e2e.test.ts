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

describe("Municipality User Roles Management", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("Complete Role Management Workflow", () => {
    it("should manage municipality users across all three roles", async () => {

      // Step 1: Create administrator via API
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const preAgent = request.agent(app);
      await preAgent
        .post("/api/citizen/signup")
        .send({
          firstName: "Super",
          lastName: "Admin",
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);
      // Promote to ADMINISTRATOR directly in DB
      await AppDataSource.getRepository(User).update(
        { email: adminEmail },
        { role: "ADMINISTRATOR" as any, isVerified: true }
      );
      // Crea un nuovo agent e fai login per ottenere la sessione aggiornata
      const agent = request.agent(app);
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
      console.log("✓ Administrator created, promoted and logged in (fresh session)");

      // Step 2: Create users with each municipality role
      console.log("Step 2: Creating users for each role...");
      const roles = ["PUBLIC_RELATIONS", "MUNICIPAL_BUILDING_MAINTENANCE"]; // Only municipality roles, not ADMINISTRATOR
      const createdUsers: any[] = [];

      for (const role of roles) {
        const userData = {
          firstName: `${role}`,
          lastName: "User",
          email: `${role.toLowerCase()}.${Date.now()}@municipality.gov`,
          password: "Pass123!",
          role: role,
        };

        const response = await agent
          .post("/api/admin/municipality-users")
          .send(userData)
          .expect(201);

        expect(response.body.role).toBe(role);
        createdUsers.push(response.body);
        console.log(`✓ Created ${role} user (ID: ${response.body.id})`);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Step 3: Retrieve and verify all users
      console.log("Step 3: Verifying all created users...");
      const listResponse = await agent
        .get("/api/admin/municipality-users")
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(roles.length);

      for (const createdUser of createdUsers) {
        const foundUser = listResponse.body.find(
          (u: any) => u.id === createdUser.id
        );
        expect(foundUser).toBeDefined();
        expect(foundUser.role).toBe(createdUser.role);
        console.log(`✓ Verified ${createdUser.role} user in list`);
      }

      // Step 4: Get details for each user
      console.log("Step 4: Retrieving individual user details...");
      for (const user of createdUsers) {
        const response = await agent
          .get(`/api/admin/municipality-users/${user.id}`)
          .expect(200);

        expect(response.body.id).toBe(user.id);
        expect(response.body.role).toBe(user.role);
        console.log(`✓ Retrieved ${user.role} user details`);
      }

      // Step 5: Delete users
      console.log("Step 5: Deleting municipality users...");
      for (const user of createdUsers) {
        await agent
          .delete(`/api/admin/municipality-users/${user.id}`)
          .expect(204); // 204 No Content is correct for successful deletion
        console.log(`✓ Deleted ${user.role} user`);
      }

      console.log("🎉 Complete role management workflow test passed!");
    });

    it("should handle concurrent role operations", async () => {
      // Setup admin via API and login
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const agent = request.agent(app);
      await agent
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
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Create multiple users concurrently
      console.log("Creating multiple users concurrently...");
      const createPromises = [
        "PUBLIC_RELATIONS",
        "MUNICIPAL_BUILDING_MAINTENANCE",
      ].map((role, index) =>
        agent.post("/api/admin/municipality-users").send({
          firstName: "Concurrent",
          lastName: `${role}-${index}`,
          email: `concurrent.${role.toLowerCase()}.${index}.${Date.now()}@municipality.gov`,
          password: "Pass123!",
          role: role,
        })
      );

      const results = await Promise.all(createPromises);

      results.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
      });

      console.log(
        `✓ Successfully created ${results.length} users concurrently`
      );

      // Verify all were created
      const listResponse = await agent
        .get("/api/admin/municipality-users")
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(results.length);
      console.log("✓ All concurrent creations verified");
    });
  });

  describe("Role-Based Access Control", () => {
    it("should enforce proper access control for each role", async () => {
      const timestamp = Date.now();

      // Create admin via API/signup, promote, login
      const adminEmail = `admin${timestamp}@example.com`;
      const adminPassword = "Pass123!";
      const adminAgent = request.agent(app);
      await adminAgent
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
      await adminAgent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Create other users via API/signup (so password is hashed correctly)
      const prEmail = `pr${timestamp}@example.com`;
      const techEmail = `tech${timestamp}@example.com`;
      const citizenEmail = `citizen${timestamp}@example.com`;
      const userPassword = "Pass123!";

      // PR
      await adminAgent
        .post("/api/admin/municipality-users")
        .send({
          firstName: "PR",
          lastName: "User",
          email: prEmail,
          password: userPassword,
          role: "PUBLIC_RELATIONS",
        })
        .expect(201);
      // TECH
      await adminAgent
        .post("/api/admin/municipality-users")
        .send({
          firstName: "Tech",
          lastName: "User",
          email: techEmail,
          password: userPassword,
          role: "MUNICIPAL_BUILDING_MAINTENANCE",
        })
        .expect(201);
      // CITIZEN (via citizen signup)
      await request(app)
        .post("/api/citizen/signup")
        .send({
          firstName: "Citizen",
          lastName: "User",
          email: citizenEmail,
          password: userPassword,
        })
        .expect(201);
      // Mark as verified for Story 27 compatibility
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });

      // Test ADMINISTRATOR access
      console.log("Testing ADMINISTRATOR access...");
      await adminAgent.get("/api/admin/municipality-users").expect(200);
      console.log("✓ ADMINISTRATOR can access admin endpoints");

      // Test PUBLIC_RELATIONS access (should be denied)
      console.log("Testing PUBLIC_RELATIONS access...");
      const prAgent = request.agent(app);
      await prAgent
        .post("/api/session")
        .send({ email: prEmail, password: userPassword })
        .expect(200);
      await prAgent.get("/api/admin/municipality-users").expect(403);
      console.log("✓ PUBLIC_RELATIONS correctly denied admin access");

      // Test MUNICIPAL_BUILDING_MAINTENANCE access (should be denied)
      console.log("Testing MUNICIPAL_BUILDING_MAINTENANCE access...");
      const techAgent = request.agent(app);
      await techAgent
        .post("/api/session")
        .send({ email: techEmail, password: userPassword })
        .expect(200);
      await techAgent.get("/api/admin/municipality-users").expect(403);
      console.log(
        "✓ MUNICIPAL_BUILDING_MAINTENANCE correctly denied admin access"
      );

      // Test CITIZEN access (should be denied)
      console.log("Testing CITIZEN access...");
      const citizenAgent = request.agent(app);
      await citizenAgent
        .post("/api/session")
        .send({ email: citizenEmail, password: userPassword })
        .expect(200);
      await citizenAgent.get("/api/admin/municipality-users").expect(403);
      console.log("✓ CITIZEN correctly denied admin access");

      console.log("✓ All role-based access controls working correctly");
    });
  });

  describe("Role Validation", () => {
    let adminAgent: any;

    beforeEach(async () => {
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      adminAgent = request.agent(app);
      await adminAgent
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
      await adminAgent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
    });

    it("should only accept valid municipality roles", async () => {
      const validRoles = ["PUBLIC_RELATIONS", "MUNICIPAL_BUILDING_MAINTENANCE"]; // Only municipality roles

      for (const role of validRoles) {
        const response = await adminAgent
          .post("/api/admin/municipality-users")
          .send({
            firstName: "Valid",
            lastName: role,
            email: `valid.${role.toLowerCase()}.${Date.now()}@municipality.gov`,
            password: "Pass123!",
            role: role,
          })
          .expect(201);

        expect(response.body.role).toBe(role);
        console.log(`✓ ${role} accepted`);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });

    it("should reject CITIZEN role for municipality users", async () => {
      const response = await adminAgent
        .post("/api/admin/municipality-users")
        .send({
          firstName: "Invalid",
          lastName: "Citizen",
          email: `invalid.citizen.${Date.now()}@example.com`,
          password: "Pass123!",
          role: "CITIZEN",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      console.log("✓ CITIZEN role correctly rejected for municipality user");
    });

    it("should reject completely invalid roles", async () => {
      const invalidRoles = ["SUPER_USER", "MODERATOR", "GUEST", ""];

      for (const role of invalidRoles) {
        const response = await adminAgent
          .post("/api/admin/municipality-users")
          .send({
            firstName: "Invalid",
            lastName: "Role",
            email: `invalid.${Date.now()}@example.com`,
            password: "Pass123!",
            role: role,
          })
          .expect(400);

        expect(response.body).toHaveProperty("error");
        console.log(`✓ Invalid role "${role}" correctly rejected`);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
  });

  describe("Role Persistence and Retrieval", () => {
    it("should correctly persist and retrieve role information", async () => {
      // Setup admin via API/signup, promote, login
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const agent = request.agent(app);
      await agent
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
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Create a user with each role
      const roles = ["PUBLIC_RELATIONS", "MUNICIPAL_BUILDING_MAINTENANCE"];
      const userIds: number[] = [];

      for (const role of roles) {
        const createResponse = await agent
          .post("/api/admin/municipality-users")
          .send({
            firstName: "Persist",
            lastName: role,
            email: `persist.${role.toLowerCase()}.${Date.now()}@municipality.gov`,
            password: "Pass123!",
            role: role,
          })
          .expect(201);

        userIds.push(createResponse.body.id);
        expect(createResponse.body.role).toBe(role);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Retrieve each user and verify role is still correct
      for (let i = 0; i < userIds.length; i++) {
        const getResponse = await agent
          .get(`/api/admin/municipality-users/${userIds[i]}`)
          .expect(200);

        expect(getResponse.body.role).toBe(roles[i]);
        console.log(`✓ Role ${roles[i]} correctly persisted and retrieved`);
      }

      // Retrieve list and verify roles
      const listResponse = await agent
        .get("/api/admin/municipality-users")
        .expect(200);

      for (const userId of userIds) {
        const user = listResponse.body.find((u: any) => u.id === userId);
        expect(user).toBeDefined();
        expect(user.role).toMatch(
          /PUBLIC_RELATIONS|MUNICIPAL_BUILDING_MAINTENANCE/
        );
      }

      console.log("✓ All roles correctly persisted in database");
    });
  });

  describe("Available Roles Endpoint", () => {
    it("should retrieve complete list of available roles", async () => {
      // Setup admin via API/signup, promote, login
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = "AdminPass123!";
      const agent = request.agent(app);
      await agent
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
      await agent
        .post("/api/session")
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Get roles list
      const response = await agent.get("/api/admin/roles").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain("PUBLIC_RELATIONS");
      expect(response.body).toContain("MUNICIPAL_BUILDING_MAINTENANCE");
      // Municipality roles endpoint returns at least the expected municipality roles (ADMINISTRATOR excluded)
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      console.log(
        `✓ Retrieved ${
          response.body.length
        } municipality roles: ${response.body.join(", ")}`
      );
    });
  });
});
