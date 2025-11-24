import request from "supertest";
import { createApp } from "../../../src/app";
import adminRoutes from "../../../src/routes/adminRoutes";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import { createUserInDatabase } from "../../helpers/testUtils";

// test suite for POST /api/admin/municipality-users
// test the creation of a municipality user account by an authenticated admin

const app = createApp();
app.use("/api/admin", adminRoutes);

describe("POST /api/admin/municipality-users", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should allow an authenticated admin to create a municipality user (happy path)", async () => {
    // Arrange - create admin in DB
    const adminEmail = `admin-${Date.now()}@example.com`;
    const adminPassword = "Admin1234!";
    await createUserInDatabase({
      email: adminEmail,
      password: adminPassword,
      role: "ADMINISTRATOR",
    });

    // Login using agent to persist session cookie
    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    // Act - create municipality user
    const newEmail = `mun-${Date.now()}@example.com`;
    const response = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Alice",
        lastName: "Smith",
        email: newEmail,
        password: "Municipal123!",
        role: "PUBLIC_RELATIONS",
      })
      .expect(201);

    // Assert
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("firstName", "Alice");
    expect(response.body).toHaveProperty("lastName", "Smith");
    expect(response.body).toHaveProperty("email", newEmail);
    expect(response.body).toHaveProperty("role", "PUBLIC_RELATIONS");
  });

  it("should return 401 when not authenticated", async () => {
    const payload = {
      firstName: "Bob",
      lastName: "Williams",
      email: `bob-${Date.now()}@example.com`,
      password: "Municipal123!",
      role: "MUNICIPAL_BUILDING_MAINTENANCE",
    };

    await request(app)
      .post("/api/admin/municipality-users")
      .send(payload)
      .expect(401);
  });

  it("should return 403 when authenticated but not an admin", async () => {
    // Arrange - create a regular citizen user
    const userEmail = `user-${Date.now()}@example.com`;
    const userPassword = "User1234!";
    await createUserInDatabase({
      email: userEmail,
      password: userPassword,
      role: "CITIZEN",
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: userEmail, password: userPassword })
      .expect(200);

    // Act
    await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Eve",
        lastName: "Adams",
        email: `eve-${Date.now()}@example.com`,
        password: "Municipal123!",
        role: "PUBLIC_RELATIONS",
      })
      .expect(403);
  });

  it("should return 400 when required fields are missing", async () => {
    const adminEmail = `admin2-${Date.now()}@example.com`;
    const adminPassword = "Admin1234!";
    await createUserInDatabase({
      email: adminEmail,
      password: adminPassword,
      role: "ADMINISTRATOR",
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    // Act - missing role
    const response = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "NoRole",
        lastName: "User",
        email: `norole-${Date.now()}@example.com`,
        password: "Municipal123!",
      })
      .expect(400);

    expect(response.body).toHaveProperty("error", "BadRequest");
  });

  it("should return 409 when email already exists", async () => {
    // Arrange - create existing user
    const existingEmail = `exists-${Date.now()}@example.com`;
    await createUserInDatabase({ email: existingEmail });

    // create admin and login
    const adminEmail = `admin3-${Date.now()}@example.com`;
    const adminPassword = "Admin1234!";
    await createUserInDatabase({
      email: adminEmail,
      password: adminPassword,
      role: "ADMINISTRATOR",
    });

    const agent = request.agent(app);
    await agent
      .post("/api/session")
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    // Act - try to create municipality user with existing email
    const response = await agent
      .post("/api/admin/municipality-users")
      .send({
        firstName: "Conflict",
        lastName: "User",
        email: existingEmail,
        password: "Municipal123!",
        role: "PUBLIC_RELATIONS",
      })
      .expect(409);

    expect(response.body).toHaveProperty("error", "Conflict");
  });
});
