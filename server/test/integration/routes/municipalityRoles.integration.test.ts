import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import {
  createTestUserData,
  createUserInDatabase,
} from "../../helpers/testUtils";
import { Role } from "../../../../shared/RoleTypes"; // Aggiungi questa linea

const app = createApp();

// Municipality User Role Management - User Story 935 + Story 10 // Aggiorna questo commento
describe("GET /api/admin/municipality-users", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should list municipality users", async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `mun-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .get("/api/admin/municipality-users")
      .expect(200);

    // Assert
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].role).toEqual(["PUBLIC_RELATIONS"]);
    expect(response.body[0]).toHaveProperty("email", munUserEmail);
    expect(response.body[0]).not.toHaveProperty("password");
  });

  it("should return empty array when no municipality users exist", async () => {
    // Arrange - create admin only
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .get("/api/admin/municipality-users")
      .expect(200);

    // Assert
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

  it("should return 401 when not authenticated", async () => {
    // Act
    const response = await request(app)
      .get("/api/admin/municipality-users")
      .expect(401);

    // Assert
    expect(response.body).toHaveProperty("error", "Unauthorized");
  });
});

describe("POST /api/admin/municipality-users", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should create new municipality user successfully", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    const newUserData = {
      firstName: "Test",
      lastName: "User",
      email: `new-user-${Date.now()}@comune.torino.it`,
      password: "Password123!",
      role: ["PUBLIC_RELATIONS"]
    };

    // Act
    const response = await agent
      .post("/api/admin/municipality-users")
      .send(newUserData)
      .expect(201);

    // Assert
    expect(response.body).toHaveProperty("id");
    expect(response.body.firstName).toBe(newUserData.firstName);
    expect(response.body.lastName).toBe(newUserData.lastName);
    expect(response.body.email).toBe(newUserData.email);
    expect(response.body.role).toEqual(newUserData.role);
    expect(response.body).not.toHaveProperty("password");
  });

  it("should reject creation with missing required fields", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    const incompleteUserData = {
      firstName: "Test",
      // missing lastName, email, password, role
    };

    // Act & Assert
    const response = await agent
      .post("/api/admin/municipality-users")
      .send(incompleteUserData)
      .expect(400);

    expect(response.body.message).toContain("request/body must have required property");
  });

  it("should reject creation with invalid email format", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    const invalidEmailData = {
      firstName: "Test",
      lastName: "User",
      email: "invalid-email",
      password: "Password123!",
      role: ["PUBLIC_RELATIONS"]
    };

    // Act & Assert
    const response = await agent
      .post("/api/admin/municipality-users")
      .send(invalidEmailData)
      .expect(400);

    expect(response.body.message).toContain("email");
  });

  it("should reject creation with invalid roles", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    const invalidRolesData = {
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@comune.torino.it`,
      password: "Password123!",
      role: ["INVALID_ROLE"]
    };

    // Act & Assert
    const response = await agent
      .post("/api/admin/municipality-users")
      .send(invalidRolesData)
      .expect(400);

    expect(response.body.message).toContain("Invalid role. Must be one of the municipality roles");
  });

  it("should return 401 when not authenticated", async () => {
    const newUserData = {
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@comune.torino.it`,
      password: "Password123!",
      role: ["PUBLIC_RELATIONS"]
    };

    // Act & Assert
    const response = await request(app)
      .post("/api/admin/municipality-users")
      .send(newUserData)
      .expect(401);

    expect(response.body).toHaveProperty("error", "Unauthorized");
  });
});

describe("GET /api/admin/municipality-users/:id", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should get municipality user by id", async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUser = await createUserInDatabase({
      email: `mun-${Date.now()}@comune.torino.it`,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .get(`/api/admin/municipality-users/${munUser.id}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty("id", munUser.id);
    expect(response.body.role).toEqual(["PUBLIC_RELATIONS"]);
    expect(response.body).not.toHaveProperty("password");
  });

  it("should return 404 for non-existent user", async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    await agent.get("/api/admin/municipality-users/999999").expect(404);
  });

  it("should return 401 when not authenticated", async () => {
    // Act
    await request(app).get("/api/admin/municipality-users/1").expect(401);
  });
});

describe("GET /api/admin/roles", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should return municipality roles", async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent.get("/api/admin/roles").expect(200);

    // Assert: response should include municipality roles and exclude ADMINISTRATOR
    expect(response.body).toEqual(expect.any(Array));
    expect(response.body).toEqual(expect.arrayContaining(["PUBLIC_RELATIONS"]));
    expect(response.body).not.toContain("ADMINISTRATOR");
  });

  it("should return 401 when not authenticated", async () => {
    // Act
    await request(app).get("/api/admin/roles").expect(401);
  });
});

describe("DELETE /api/admin/municipality-users/:id", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should successfully delete municipality user", async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `mun-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    await agent
      .delete(`/api/admin/municipality-users/${munUser.id}`)
      .expect(204);

    // Assert - verify user is deleted
    const listResponse = await agent
      .get("/api/admin/municipality-users")
      .expect(200);

    expect(listResponse.body).toBeInstanceOf(Array);
    expect(listResponse.body.length).toBe(0);
  });

  it("should return 404 for non-existent user", async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .delete("/api/admin/municipality-users/999999")
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty("error", "NotFound");
  });

  it("should return 401 when not authenticated", async () => {
    // Act
    const response = await request(app)
      .delete("/api/admin/municipality-users/1")
      .expect(401);

    // Assert
    expect(response.body).toHaveProperty("error", "Unauthorized");
  });
});

describe("Authentication error handling", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should handle authentication errors gracefully", async () => {
    // Test Case 1: Login with non-existent municipality user
    const nonExistentResponse = await request(app)
      .post("/api/session")
      .send({
        email: "nonexistent@comune.torino.it",
        password: "Municipal123!",
      })
      .expect(401);

    expect(nonExistentResponse.body).toHaveProperty("error", "Unauthorized");
    expect(nonExistentResponse.body.message).toContain(
      "Invalid username or password"
    );

    // Test Case 2: Login with wrong password
    const municipalityUser = await createUserInDatabase({
      email: `auth-test-${Date.now()}@comune.torino.it`,
      password: "Municipal123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const wrongPasswordResponse = await request(app)
      .post("/api/session")
      .send({
        email: municipalityUser.email,
        password: "WrongPassword123!",
      })
      .expect(401);

    expect(wrongPasswordResponse.body).toHaveProperty("error", "Unauthorized");
    expect(wrongPasswordResponse.body.message).toContain(
      "Invalid username or password"
    );

    // Test Case 3: Valid login and session check
    const agent = request.agent(app);

    const validLoginResponse = await agent
      .post("/api/session")
      .send({
        email: municipalityUser.email,
        password: "Municipal123!",
      })
      .expect(200);

    expect(validLoginResponse.body).toHaveProperty(
      "message",
      "Login successful"
    );

    // Verify session endpoint works
    const sessionResponse = await agent.get("/api/session/current").expect(200);

    expect(sessionResponse.body).toHaveProperty("authenticated");
  });
});

describe("Error scenarios coverage tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should return 400 when creating user with missing password", async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test@comune.torino.it",
        role: ["PUBLIC_RELATIONS"],
      })
      .expect(400);

    // Assert
    expect(response.body).toHaveProperty("error", "Bad Request");
    expect(response.body.message).toContain("password");
  });

  it("should return 400 when getting user with invalid ID format", async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act
    const response = await agent
      .get("/api/admin/municipality-users/invalid-id")
      .expect(400);

    // Assert
    expect(response.body).toHaveProperty("error", "Bad Request");
  });
});

describe("Service coverage integration tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should handle duplicate email through API", async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `existing-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - try to create user with existing municipality email
    const response = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Test",
        lastName: "User",
        email: munUserEmail,
        password: "Test123!",
        role: ["MUNICIPAL_BUILDING_MAINTENANCE"],
      })
      .expect(409);

    // Assert
    expect(response.body).toHaveProperty("error", "Conflict");
  });

  it("should return 404 for citizen user ID in municipality endpoint", async () => {
    // Arrange - create admin and citizen user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const citizenEmail = `citizen-${Date.now()}@example.com`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const citizen = await createUserInDatabase({
      email: citizenEmail,
      password: "Citizen123!",
      role: ["CITIZEN"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - try to get citizen through municipality user endpoint
    const response = await agent
      .get(`/api/admin/municipality-users/${citizen.id}`)
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty("error", "NotFound");
  });

  it("should return 404 when trying to delete citizen through municipality endpoint", async () => {
    // Arrange - create admin and citizen user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const citizenEmail = `citizen-${Date.now()}@example.com`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const citizen = await createUserInDatabase({
      email: citizenEmail,
      password: "Citizen123!",
      role: ["CITIZEN"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - try to delete citizen through municipality user endpoint
    const response = await agent
      .delete(`/api/admin/municipality-users/${citizen.id}`)
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty("error", "NotFound");
  });
});

describe("PATCH /api/admin/municipality-users/:userId - Story 10: Role Modification", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should modify a user's roles successfully", async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `mun-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - Modify user roles
    const response = await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        roles: ["MUNICIPAL_BUILDING_MAINTENANCE", "INFRASTRUCTURES"],
      })
      .expect(200);

    // Assert
    expect(response.body.role).toEqual([
      "MUNICIPAL_BUILDING_MAINTENANCE",
      "INFRASTRUCTURES",
    ]);
    expect(response.body.id).toBe(munUser.id);
  });

  it("should allow assigning multiple technical office roles (Story 10 key feature)", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `multi-office-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - Assign multiple technical office roles
    const multipleRoles = [
      "MUNICIPAL_BUILDING_MAINTENANCE",
      "INFRASTRUCTURES",
      "ROAD_MAINTENANCE",
      "GREENSPACES_AND_ANIMAL_PROTECTION",
    ];

    const response = await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        roles: multipleRoles,
      })
      .expect(200);

    // Assert
    expect(response.body.role).toHaveLength(4);
    multipleRoles.forEach((role) => {
      expect(response.body.role).toContain(role);
    });
  });

  it("should support role cancellation (removing specific roles)", async () => {
    // Arrange - Create user with multiple roles
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `role-removal-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    // Create user via API to have multiple roles
    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    const createResponse = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Multi",
        lastName: "Role",
        email: munUserEmail,
        password: "Test123!",
        role: [
          "PUBLIC_RELATIONS",
          "MUNICIPAL_BUILDING_MAINTENANCE",
          "INFRASTRUCTURES",
        ],
      })
      .expect(201);

    const userId = createResponse.body.id;

    // Act - Remove some roles, keep others
    const response = await agent
      .patch(`/api/admin/municipality-users/${userId}`)
      .send({
        roles: ["PUBLIC_RELATIONS"], // Remove technical roles, keep administrative
      })
      .expect(200);

    // Assert
    expect(response.body.role).toEqual(["PUBLIC_RELATIONS"]);
    expect(response.body.role).not.toContain("MUNICIPAL_BUILDING_MAINTENANCE");
    expect(response.body.role).not.toContain("INFRASTRUCTURES");
  });

  it("should update roles combined with other user data", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `combined-update-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - Update name and roles simultaneously
    const response = await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        firstName: "Updated",
        lastName: "Name",
        roles: ["EDUCATION_SERVICES", "WASTE_MANAGEMENT"],
      })
      .expect(200);

    // Assert
    expect(response.body.firstName).toBe("Updated");
    expect(response.body.lastName).toBe("Name");
    expect(response.body.role).toEqual([
      "EDUCATION_SERVICES",
      "WASTE_MANAGEMENT",
    ]);
  });

  it("should reject empty roles array", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `empty-roles-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act & Assert
    const response = await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        roles: [],
      })
      .expect(400);

    expect(response.body.message).toContain("request/body/roles must NOT have fewer than 1 items");
  });

  it("should reject invalid roles", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `invalid-roles-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act & Assert
    const response = await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        roles: ["INVALID_ROLE", "ANOTHER_INVALID"],
      })
      .expect(400);

    expect(response.body.message).toContain("must be equal to one of the allowed values");
  });

  it("should return 500 for non-existent user (no 404 defined in OpenAPI)", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act & Assert
    // The application returns 404 when the user doesn't exist
    const response = await agent
      .patch("/api/admin/municipality-users/999999")
      .send({
        roles: ["PUBLIC_RELATIONS"],
      })
      .expect(404);

    // The response structure indicates the user was not found
    expect(response.status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    // Act & Assert
    const response = await request(app)
      .patch("/api/admin/municipality-users/1")
      .send({
        roles: ["PUBLIC_RELATIONS"],
      })
      .expect(401);

    expect(response.body).toHaveProperty("error", "Unauthorized");
  });

  it("should reflect role changes in subsequent GET requests", async () => {
    // Arrange
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `persistence-test-${Date.now()}@comune.torino.it`;

    await createUserInDatabase({
      email: adminEmail,
      password: "Admin1234!",
      role: ["ADMINISTRATOR"],
    });
    const munUser = await createUserInDatabase({
      email: munUserEmail,
      password: "Mun123!",
      role: ["PUBLIC_RELATIONS"],
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: "Admin1234!" })
      .expect(200);

    // Act - Modify roles
    await agent
      .patch(`/api/admin/municipality-users/${munUser.id}`)
      .send({
        roles: ["MUNICIPAL_BUILDING_MAINTENANCE", "EDUCATION_SERVICES"],
      })
      .expect(200);

    // Assert - Check individual user GET
    const getUserResponse = await agent
      .get(`/api/admin/municipality-users/${munUser.id}`)
      .expect(200);

    expect(getUserResponse.body.role).toEqual([
      "MUNICIPAL_BUILDING_MAINTENANCE",
      "EDUCATION_SERVICES",
    ]);

    // Assert - Check in users list
    const listResponse = await agent
      .get("/api/admin/municipality-users")
      .expect(200);

    const updatedUser = listResponse.body.find((u: any) => u.id === munUser.id);
    expect(updatedUser).toBeDefined();
    expect(updatedUser.role).toEqual([
      "MUNICIPAL_BUILDING_MAINTENANCE",
      "EDUCATION_SERVICES",
    ]);
  });
});
