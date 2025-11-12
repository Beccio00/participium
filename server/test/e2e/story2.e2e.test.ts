import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase } from '../helpers/testSetup';
import { createUserInDatabase } from '../helpers/testUtils';

const app = createApp();

/**
 * Story 2 E2E Tests - Administrator Managing Municipality Users
 * 
 * This test suite validates the complete administrator workflow for managing municipality users:
 * 1. Admin logs in
 * 2. Admin creates a new municipality user
 * 3. Admin retrieves the list of municipality users
 * 4. Admin gets details of a specific municipality user
 * 5. Admin deletes a municipality user
 */
describe('Story 2 E2E - Administrator Managing Municipality Users', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Complete Admin Workflow: Login → Create → List → Get → Delete', () => {
    it('should complete the full municipality user management lifecycle', async () => {
      // Setup: Create an admin user
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = 'AdminPass123!';
      
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: adminPassword,
        role: 'ADMINISTRATOR',
      });

      // Step 1: Admin Login
      console.log('Step 1: Admin logging in...');
      const agent = request.agent(app);
      const loginResponse = await agent
        .post('/api/session')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      expect(loginResponse.body.user.role).toBe('ADMINISTRATOR');
      console.log('✓ Admin logged in successfully');

      // Step 2: Create Municipality User (PUBLIC_RELATIONS)
      console.log('Step 2: Creating a PUBLIC_RELATIONS user...');
      const newMunicipalityUser = {
        firstName: 'John',
        lastName: 'PR',
        email: `pr${Date.now()}@municipality.gov`,
        password: 'PRPass123!',
        role: 'PUBLIC_RELATIONS',
      };

      const createResponse = await agent
        .post('/api/admin/municipality-users')
        .send(newMunicipalityUser)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.email).toBe(newMunicipalityUser.email);
      expect(createResponse.body.role).toBe('PUBLIC_RELATIONS');
      const userId = createResponse.body.id;
      console.log('✓ PUBLIC_RELATIONS user created successfully');

      // Step 3: List All Municipality Users
      console.log('Step 3: Retrieving list of municipality users...');
      const listResponse = await agent
        .get('/api/admin/municipality-users')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);
      
      const createdUser = listResponse.body.find((u: any) => u.id === userId);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(newMunicipalityUser.email);
      console.log(`✓ Retrieved ${listResponse.body.length} municipality user(s)`);

      // Step 4: Get Specific Municipality User
      console.log('Step 4: Getting details of specific user...');
      const getResponse = await agent
        .get(`/api/admin/municipality-users/${userId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(userId);
      expect(getResponse.body.email).toBe(newMunicipalityUser.email);
      expect(getResponse.body.firstName).toBe(newMunicipalityUser.firstName);
      console.log('✓ User details retrieved successfully');

      // Step 5: Delete Municipality User
      console.log('Step 5: Deleting the municipality user...');
      await agent
        .delete(`/api/admin/municipality-users/${userId}`)
        .expect(204); // 204 No Content is correct for successful deletion
      console.log('✓ User deleted successfully');

      // Step 6: Verify Deletion
      console.log('Step 6: Verifying user was deleted...');
      await agent
        .get(`/api/admin/municipality-users/${userId}`)
        .expect(404);
      console.log('✓ User deletion verified');

      console.log('🎉 Complete admin workflow test passed!');
    });

    it('should create and manage multiple municipality users with different roles', async () => {
      // Setup: Create admin
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = 'AdminPass123!';
      
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: adminPassword,
        role: 'ADMINISTRATOR',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      // Create users with different roles
      const roles = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE'];
      const createdUserIds: number[] = [];

      for (const role of roles) {
        console.log(`Creating ${role} user...`);
        const userData = {
          firstName: 'Test',
          lastName: role,
          email: `${role.toLowerCase()}${Date.now()}@municipality.gov`,
          password: 'Pass123!',
          role: role,
        };

        const response = await agent
          .post('/api/admin/municipality-users')
          .send(userData)
          .expect(201);

        expect(response.body.role).toBe(role);
        createdUserIds.push(response.body.id);
        console.log(`✓ ${role} user created`);

        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verify all users are in the list
      const listResponse = await agent
        .get('/api/admin/municipality-users')
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(roles.length);
      
      for (const userId of createdUserIds) {
        const user = listResponse.body.find((u: any) => u.id === userId);
        expect(user).toBeDefined();
      }

      console.log('✓ All users verified in the list');
    });
  });

  describe('Authorization and Access Control', () => {
    it('should prevent non-admin users from accessing admin endpoints', async () => {
      // Create a regular citizen user
      const citizenEmail = `citizen${Date.now()}@example.com`;
      const citizenPassword = 'CitizenPass123!';
      
      await createUserInDatabase({
        email: citizenEmail,
        first_name: 'Regular',
        last_name: 'Citizen',
        password: citizenPassword,
        role: 'CITIZEN',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: citizenEmail, password: citizenPassword })
        .expect(200);

      // Try to access admin endpoints
      await agent
        .get('/api/admin/municipality-users')
        .expect(403);

      await agent
        .post('/api/admin/municipality-users')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'Pass123!',
          role: 'PUBLIC_RELATIONS',
        })
        .expect(403);

      console.log('✓ Non-admin access correctly denied');
    });

    it('should require authentication for admin endpoints', async () => {
      // Try to access without login
      await request(app)
        .get('/api/admin/municipality-users')
        .expect(401);

      await request(app)
        .post('/api/admin/municipality-users')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'Pass123!',
          role: 'PUBLIC_RELATIONS',
        })
        .expect(401);

      console.log('✓ Unauthenticated access correctly denied');
    });
  });

  describe('Data Validation', () => {
    let adminAgent: any;

    beforeEach(async () => {
      // Create and login as admin
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = 'AdminPass123!';
      
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: adminPassword,
        role: 'ADMINISTRATOR',
      });

      adminAgent = request.agent(app);
      await adminAgent
        .post('/api/session')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
    });

    it('should reject creation with missing required fields', async () => {
      const incompleteData = {
        firstName: 'John',
        // Missing lastName, email, password, role
      };

      const response = await adminAgent
        .post('/api/admin/municipality-users')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Incomplete data correctly rejected');
    });

    it('should reject creation with invalid role', async () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `test${Date.now()}@municipality.gov`,
        password: 'Pass123!',
        role: 'INVALID_ROLE',
      };

      const response = await adminAgent
        .post('/api/admin/municipality-users')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Invalid role correctly rejected');
    });

    it('should reject duplicate email addresses', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `duplicate${Date.now()}@municipality.gov`,
        password: 'Pass123!',
        role: 'PUBLIC_RELATIONS',
      };

      // First creation should succeed
      await adminAgent
        .post('/api/admin/municipality-users')
        .send(userData)
        .expect(201);

      // Second creation with same email should fail
      const response = await adminAgent
        .post('/api/admin/municipality-users')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Duplicate email correctly rejected');
    });

    it('should reject deletion of non-existent user', async () => {
      const nonExistentId = 999999;

      const response = await adminAgent
        .delete(`/api/admin/municipality-users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Deletion of non-existent user correctly rejected');
    });
  });

  describe('Role Management', () => {
    let adminAgent: any;

    beforeEach(async () => {
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = 'AdminPass123!';
      
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: adminPassword,
        role: 'ADMINISTRATOR',
      });

      adminAgent = request.agent(app);
      await adminAgent
        .post('/api/session')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
    });

    it('should retrieve list of available roles', async () => {
      const response = await adminAgent
        .get('/api/admin/roles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('PUBLIC_RELATIONS');
      expect(response.body).toContain('TECHNICAL_OFFICE');
      // ADMINISTRATOR and CITIZEN are not in municipality roles list
      expect(response.body.length).toBe(2);
      console.log(`✓ Retrieved ${response.body.length} municipality roles`);
    });

    it('should only allow creating municipality roles (not CITIZEN)', async () => {
      const citizenData = {
        firstName: 'Test',
        lastName: 'Citizen',
        email: `testcitizen${Date.now()}@example.com`,
        password: 'Pass123!',
        role: 'CITIZEN',
      };

      const response = await adminAgent
        .post('/api/admin/municipality-users')
        .send(citizenData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ CITIZEN role correctly rejected for municipality user');
    });
  });
});

