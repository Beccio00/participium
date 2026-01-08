jest.mock('../../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import {
  createUserInDatabase,
  verifyPasswordIsHashed,
} from "../../helpers/testUtils";
import { createSignupData, assertUserDTO, assertErrorResponse } from "../../helpers/testHelpers";

const app = createApp();

describe("POST /api/citizen/signup", () => {
  // Clean database before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Disconnect database after all tests
  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("Success scenarios", () => {
    it("should successfully register a new citizen with valid data", async () => {
      // Arrange - Use helper to create signup data
      const userData = createSignupData({
        firstName: "TestFirst",
        lastName: "TestLast",
      });

      // Act
      const response = await request(app)
        .post("/api/citizen/signup")
        .send(userData)
        .expect(201);

      // Assert - Use helper to verify user DTO
      expect(response.headers["content-type"]).toMatch(/json/);
      assertUserDTO(response.body, {
        firstName: "TestFirst",
        lastName: "TestLast",
        email: userData.email,
        role: ["CITIZEN"],
      });
      expect(response.body).toHaveProperty("telegramUsername", null);
      expect(response.body).toHaveProperty("emailNotificationsEnabled", true);
    });

    it("should encrypt password before storing in database", async () => {
      // Arrange - Use helper to create signup data
      const userData = createSignupData({
        firstName: "EncryptTest",
        lastName: "User",
      });

      // Act
      await request(app).post("/api/citizen/signup").send(userData).expect(201);

      // Assert - Verify password is encrypted before storage
      const isHashed = await verifyPasswordIsHashed(userData.email, userData.password);
      expect(isHashed).toBe(true);
    });
  });

  describe("Validation - Missing required fields", () => {
    it('should return 400 when firstName is missing', async () => {
      const userData = createSignupData();
      delete (userData as any).firstName;
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      assertErrorResponse(response.body, 'Bad Request', 'firstName');
    });

    it('should return 400 when lastName is missing', async () => {
      const userData = createSignupData();
      delete (userData as any).lastName;
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      assertErrorResponse(response.body, 'Bad Request', 'lastName');
    });

    it('should return 400 when email is missing', async () => {
      const userData = createSignupData();
      delete (userData as any).email;
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      assertErrorResponse(response.body, 'Bad Request', 'email');
    });

    it('should return 400 when password is missing', async () => {
      const userData = createSignupData();
      delete (userData as any).password;
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      assertErrorResponse(response.body, 'Bad Request', 'password');
    });
    it('should return 400 when multiple fields are missing', async () => {
      const userData = { firstName: 'John' }; // Missing lastName, email, password
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      // OpenAPI validator only reports the first missing field
      assertErrorResponse(response.body, 'Bad Request', 'lastName');
    });
  });

  describe("Validation - Email conflict", () => {
    it("should return 409 when email already exists", async () => {
      const existingEmail = "existing@test.com";
      await createUserInDatabase({ email: existingEmail });

      const newUserData = createSignupData({ email: existingEmail });

      const response = await request(app)
        .post("/api/citizen/signup")
        .send(newUserData)
        .expect(409);

      assertErrorResponse(response.body, "Conflict", "Email already in use");
    });

    it("should allow registration with different email", async () => {
      await createUserInDatabase({ email: "existing@test.com" });
      const newUserData = createSignupData({ email: "new@test.com" });

      const response = await request(app)
        .post("/api/citizen/signup")
        .send(newUserData)
        .expect(201);

      assertUserDTO(response.body, { email: "new@test.com" });
    });
  });

  describe("Edge cases", () => {
    it('should handle empty string fields as missing', async () => {
      const userData = createSignupData({ firstName: '' });
      
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);
      
      assertErrorResponse(response.body, 'Bad Request', 'firstName');
    });
  });
});
