import request from 'supertest';
import { createApp } from '../../../src/app';
import { cleanDatabase, disconnectDatabase } from '../../helpers/testSetup';
import { createTestUserData, createUserInDatabase } from '../../helpers/testUtils';

const app = createApp();

// Municipality User Role Management - User Story 935

describe('GET /api/admin/municipality-users', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should list municipality users', async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `mun-${Date.now()}@comune.torino.it`;
    
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });
    await createUserInDatabase({ 
      email: munUserEmail, 
      password: 'Mun123!', 
      role: 'PUBLIC_RELATIONS' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .get('/api/admin/municipality-users')
      .expect(200);

    // Assert
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('role', 'PUBLIC_RELATIONS');
    expect(response.body[0]).toHaveProperty('email', munUserEmail);
    expect(response.body[0]).not.toHaveProperty('password');
  });

  it('should return empty array when no municipality users exist', async () => {
    // Arrange - create admin only
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .get('/api/admin/municipality-users')
      .expect(200);

    // Assert
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    const response = await request(app)
      .get('/api/admin/municipality-users')
      .expect(401);

    // Assert
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('GET /api/admin/municipality-users/:id', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should get municipality user by id', async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUser = await createUserInDatabase({ 
      email: `mun-${Date.now()}@comune.torino.it`, 
      password: 'Mun123!', 
      role: 'PUBLIC_RELATIONS' 
    });
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .get(`/api/admin/municipality-users/${munUser.id}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('id', munUser.id);
    expect(response.body).toHaveProperty('role', 'PUBLIC_RELATIONS');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should return 404 for non-existent user', async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    await agent
      .get('/api/admin/municipality-users/999999')
      .expect(404);
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    await request(app)
      .get('/api/admin/municipality-users/1')
      .expect(401);
  });
});

describe('GET /api/admin/roles', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should return municipality roles', async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .get('/api/admin/roles')
      .expect(200);

    // Assert
    expect(response.body).toEqual(['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE']);
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    await request(app)
      .get('/api/admin/roles')
      .expect(401);
  });
});

describe('DELETE /api/admin/municipality-users/:id', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should successfully delete municipality user', async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `mun-${Date.now()}@comune.torino.it`;
    
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });
    const munUser = await createUserInDatabase({ 
      email: munUserEmail, 
      password: 'Mun123!', 
      role: 'PUBLIC_RELATIONS' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    await agent
      .delete(`/api/admin/municipality-users/${munUser.id}`)
      .expect(204);

    // Assert - verify user is deleted
    const listResponse = await agent
      .get('/api/admin/municipality-users')
      .expect(200);
    
    expect(listResponse.body).toBeInstanceOf(Array);
    expect(listResponse.body.length).toBe(0);
  });

  it('should return 404 for non-existent user', async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .delete('/api/admin/municipality-users/999999')
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty('error', 'NotFound');
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    const response = await request(app)
      .delete('/api/admin/municipality-users/1')
      .expect(401);

    // Assert
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('Authentication error handling', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should handle authentication errors gracefully', async () => {
    // Test Case 1: Login with non-existent municipality user
    const nonExistentResponse = await request(app)
      .post('/api/session')
      .send({
        email: 'nonexistent@comune.torino.it',
        password: 'Municipal123!'
      })
      .expect(401);

    expect(nonExistentResponse.body).toHaveProperty('error', 'Unauthorized');
    expect(nonExistentResponse.body.message).toContain('Invalid username or password');

    // Test Case 2: Login with wrong password
    const municipalityUser = await createUserInDatabase({
      email: `auth-test-${Date.now()}@comune.torino.it`,
      password: 'Municipal123!',
      role: 'PUBLIC_RELATIONS'
    });

    const wrongPasswordResponse = await request(app)
      .post('/api/session')
      .send({
        email: municipalityUser.email,
        password: 'WrongPassword123!'
      })
      .expect(401);

    expect(wrongPasswordResponse.body).toHaveProperty('error', 'Unauthorized');
    expect(wrongPasswordResponse.body.message).toContain('Invalid username or password');

    // Test Case 3: Valid login and session check
    const agent = request.agent(app);
    
    const validLoginResponse = await agent
      .post('/api/session')
      .send({
        email: municipalityUser.email,
        password: 'Municipal123!'
      })
      .expect(200);

    expect(validLoginResponse.body).toHaveProperty('message', 'Login successful');

    // Verify session endpoint works
    const sessionResponse = await agent
      .get('/api/session/current')
      .expect(200);

    expect(sessionResponse.body).toHaveProperty('authenticated');
  });
});

describe('Error scenarios coverage tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should return 400 when creating user with missing password', async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .post('/api/admin/municipality-users')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@comune.torino.it',
        role: 'PUBLIC_RELATIONS'
      })
      .expect(400);

    // Assert
    expect(response.body).toHaveProperty('error', 'BadRequest');
    expect(response.body.message).toContain('password');
  });

  it('should return 400 when getting user with invalid ID format', async () => {
    // Arrange - create admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act
    const response = await agent
      .get('/api/admin/municipality-users/invalid-id')
      .expect(400);

    // Assert
    expect(response.body).toHaveProperty('error', 'BadRequest');
  });
});

describe('Service coverage integration tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should handle duplicate email through API', async () => {
    // Arrange - create admin and municipality user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const munUserEmail = `existing-${Date.now()}@comune.torino.it`;
    
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });
    await createUserInDatabase({ 
      email: munUserEmail, 
      password: 'Mun123!', 
      role: 'PUBLIC_RELATIONS' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act - try to create user with existing municipality email
    const response = await agent
      .post('/api/admin/municipality-users')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: munUserEmail,
        password: 'Test123!',
        role: 'TECHNICAL_OFFICE'
      })
      .expect(409);

    // Assert
    expect(response.body).toHaveProperty('error', 'Conflict');
  });

  it('should return 404 for citizen user ID in municipality endpoint', async () => {
    // Arrange - create admin and citizen user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const citizenEmail = `citizen-${Date.now()}@example.com`;
    
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });
    const citizen = await createUserInDatabase({ 
      email: citizenEmail, 
      password: 'Citizen123!', 
      role: 'CITIZEN' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act - try to get citizen through municipality user endpoint
    const response = await agent
      .get(`/api/admin/municipality-users/${citizen.id}`)
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty('error', 'NotFound');
  });

  it('should return 404 when trying to delete citizen through municipality endpoint', async () => {
    // Arrange - create admin and citizen user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const citizenEmail = `citizen-${Date.now()}@example.com`;
    
    await createUserInDatabase({ 
      email: adminEmail, 
      password: 'Admin1234!', 
      role: 'ADMINISTRATOR' 
    });
    const citizen = await createUserInDatabase({ 
      email: citizenEmail, 
      password: 'Citizen123!', 
      role: 'CITIZEN' 
    });

    const agent = request.agent(app);
    await agent
      .post('/api/session')
      .send({ email: adminEmail, password: 'Admin1234!' })
      .expect(200);

    // Act - try to delete citizen through municipality user endpoint
    const response = await agent
      .delete(`/api/admin/municipality-users/${citizen.id}`)
      .expect(404);

    // Assert
    expect(response.body).toHaveProperty('error', 'NotFound');
  });
});