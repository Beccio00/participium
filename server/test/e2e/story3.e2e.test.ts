import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase } from '../helpers/testSetup';
import { createUserInDatabase } from '../helpers/testUtils';

const app = createApp();

/**
 * Story 3 E2E Tests - Municipality User Roles Management
 * 
 * This test suite validates the complete workflow for managing different
 * municipality user roles (ADMINISTRATOR, PUBLIC_RELATIONS, TECHNICAL_OFFICE):
 * 1. Admin manages users with different roles
 * 2. Role-based access control validation
 * 3. Complete CRUD operations for each role
 */
describe('Story 3 E2E - Municipality User Roles Management', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Complete Role Management Workflow', () => {
    it('should manage municipality users across all three roles', async () => {
      // Setup: Create administrator
      const adminEmail = `admin${Date.now()}@example.com`;
      const adminPassword = 'AdminPass123!';
      
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Super',
        last_name: 'Admin',
        password: adminPassword,
        role: 'ADMINISTRATOR',
      });

      // Step 1: Admin Login
      console.log('Step 1: Administrator logging in...');
      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);
      console.log('✓ Administrator logged in');

      // Step 2: Create users with each municipality role
      console.log('Step 2: Creating users for each role...');
      const roles = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE']; // Only municipality roles, not ADMINISTRATOR
      const createdUsers: any[] = [];

      for (const role of roles) {
        const userData = {
          firstName: `${role}`,
          lastName: 'User',
          email: `${role.toLowerCase()}.${Date.now()}@municipality.gov`,
          password: 'Pass123!',
          role: role,
        };

        const response = await agent
          .post('/api/admin/municipality-users')
          .send(userData)
          .expect(201);

        expect(response.body.role).toBe(role);
        createdUsers.push(response.body);
        console.log(`✓ Created ${role} user (ID: ${response.body.id})`);

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Step 3: Retrieve and verify all users
      console.log('Step 3: Verifying all created users...');
      const listResponse = await agent
        .get('/api/admin/municipality-users')
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(roles.length);
      
      for (const createdUser of createdUsers) {
        const foundUser = listResponse.body.find((u: any) => u.id === createdUser.id);
        expect(foundUser).toBeDefined();
        expect(foundUser.role).toBe(createdUser.role);
        console.log(`✓ Verified ${createdUser.role} user in list`);
      }

      // Step 4: Get details for each user
      console.log('Step 4: Retrieving individual user details...');
      for (const user of createdUsers) {
        const response = await agent
          .get(`/api/admin/municipality-users/${user.id}`)
          .expect(200);

        expect(response.body.id).toBe(user.id);
        expect(response.body.role).toBe(user.role);
        console.log(`✓ Retrieved ${user.role} user details`);
      }

      // Step 5: Delete users
      console.log('Step 5: Deleting municipality users...');
      for (const user of createdUsers) {
        await agent
          .delete(`/api/admin/municipality-users/${user.id}`)
          .expect(204); // 204 No Content is correct for successful deletion
        console.log(`✓ Deleted ${user.role} user`);
      }

      console.log('🎉 Complete role management workflow test passed!');
    });

    it('should handle concurrent role operations', async () => {
      // Setup admin
      const adminEmail = `admin${Date.now()}@example.com`;
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: 'AdminPass123!',
        role: 'ADMINISTRATOR',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: adminEmail, password: 'AdminPass123!' })
        .expect(200);

      // Create multiple users concurrently
      console.log('Creating multiple users concurrently...');
      const createPromises = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE'].map((role, index) => 
        agent
          .post('/api/admin/municipality-users')
          .send({
            firstName: 'Concurrent',
            lastName: `${role}-${index}`,
            email: `concurrent.${role.toLowerCase()}.${index}.${Date.now()}@municipality.gov`,
            password: 'Pass123!',
            role: role,
          })
      );

      const results = await Promise.all(createPromises);
      
      results.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      console.log(`✓ Successfully created ${results.length} users concurrently`);

      // Verify all were created
      const listResponse = await agent
        .get('/api/admin/municipality-users')
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThanOrEqual(results.length);
      console.log('✓ All concurrent creations verified');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce proper access control for each role', async () => {
      const timestamp = Date.now();
      
      // Create users with different roles
      const admin = await createUserInDatabase({
        email: `admin${timestamp}@example.com`,
        first_name: 'Admin',
        last_name: 'User',
        password: 'Pass123!',
        role: 'ADMINISTRATOR',
      });

      const prUser = await createUserInDatabase({
        email: `pr${timestamp}@example.com`,
        first_name: 'PR',
        last_name: 'User',
        password: 'Pass123!',
        role: 'PUBLIC_RELATIONS',
      });

      const techUser = await createUserInDatabase({
        email: `tech${timestamp}@example.com`,
        first_name: 'Tech',
        last_name: 'User',
        password: 'Pass123!',
        role: 'TECHNICAL_OFFICE',
      });

      const citizen = await createUserInDatabase({
        email: `citizen${timestamp}@example.com`,
        first_name: 'Citizen',
        last_name: 'User',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      // Test ADMINISTRATOR access
      console.log('Testing ADMINISTRATOR access...');
      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/session')
        .send({ email: `admin${timestamp}@example.com`, password: 'Pass123!' })
        .expect(200);

      await adminAgent
        .get('/api/admin/municipality-users')
        .expect(200);
      console.log('✓ ADMINISTRATOR can access admin endpoints');

      // Test PUBLIC_RELATIONS access (should be denied)
      console.log('Testing PUBLIC_RELATIONS access...');
      const prAgent = request.agent(app);
      await prAgent
        .post('/api/session')
        .send({ email: `pr${timestamp}@example.com`, password: 'Pass123!' })
        .expect(200);

      await prAgent
        .get('/api/admin/municipality-users')
        .expect(403);
      console.log('✓ PUBLIC_RELATIONS correctly denied admin access');

      // Test TECHNICAL_OFFICE access (should be denied)
      console.log('Testing TECHNICAL_OFFICE access...');
      const techAgent = request.agent(app);
      await techAgent
        .post('/api/session')
        .send({ email: `tech${timestamp}@example.com`, password: 'Pass123!' })
        .expect(200);

      await techAgent
        .get('/api/admin/municipality-users')
        .expect(403);
      console.log('✓ TECHNICAL_OFFICE correctly denied admin access');

      // Test CITIZEN access (should be denied)
      console.log('Testing CITIZEN access...');
      const citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/session')
        .send({ email: `citizen${timestamp}@example.com`, password: 'Pass123!' })
        .expect(200);

      await citizenAgent
        .get('/api/admin/municipality-users')
        .expect(403);
      console.log('✓ CITIZEN correctly denied admin access');

      console.log('✓ All role-based access controls working correctly');
    });
  });

  describe('Role Validation', () => {
    let adminAgent: any;

    beforeEach(async () => {
      const adminEmail = `admin${Date.now()}@example.com`;
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: 'AdminPass123!',
        role: 'ADMINISTRATOR',
      });

      adminAgent = request.agent(app);
      await adminAgent
        .post('/api/session')
        .send({ email: adminEmail, password: 'AdminPass123!' })
        .expect(200);
    });

    it('should only accept valid municipality roles', async () => {
      const validRoles = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE']; // Only municipality roles
      
      for (const role of validRoles) {
        const response = await adminAgent
          .post('/api/admin/municipality-users')
          .send({
            firstName: 'Valid',
            lastName: role,
            email: `valid.${role.toLowerCase()}.${Date.now()}@municipality.gov`,
            password: 'Pass123!',
            role: role,
          })
          .expect(201);

        expect(response.body.role).toBe(role);
        console.log(`✓ ${role} accepted`);

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    it('should reject CITIZEN role for municipality users', async () => {
      const response = await adminAgent
        .post('/api/admin/municipality-users')
        .send({
          firstName: 'Invalid',
          lastName: 'Citizen',
          email: `invalid.citizen.${Date.now()}@example.com`,
          password: 'Pass123!',
          role: 'CITIZEN',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ CITIZEN role correctly rejected for municipality user');
    });

    it('should reject completely invalid roles', async () => {
      const invalidRoles = ['SUPER_USER', 'MODERATOR', 'GUEST', ''];

      for (const role of invalidRoles) {
        const response = await adminAgent
          .post('/api/admin/municipality-users')
          .send({
            firstName: 'Invalid',
            lastName: 'Role',
            email: `invalid.${Date.now()}@example.com`,
            password: 'Pass123!',
            role: role,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        console.log(`✓ Invalid role "${role}" correctly rejected`);

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });
  });

  describe('Role Persistence and Retrieval', () => {
    it('should correctly persist and retrieve role information', async () => {
      // Setup admin
      const adminEmail = `admin${Date.now()}@example.com`;
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: 'AdminPass123!',
        role: 'ADMINISTRATOR',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: adminEmail, password: 'AdminPass123!' })
        .expect(200);

      // Create a user with each role
      const roles = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE'];
      const userIds: number[] = [];

      for (const role of roles) {
        const createResponse = await agent
          .post('/api/admin/municipality-users')
          .send({
            firstName: 'Persist',
            lastName: role,
            email: `persist.${role.toLowerCase()}.${Date.now()}@municipality.gov`,
            password: 'Pass123!',
            role: role,
          })
          .expect(201);

        userIds.push(createResponse.body.id);
        expect(createResponse.body.role).toBe(role);

        await new Promise(resolve => setTimeout(resolve, 50));
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
        .get('/api/admin/municipality-users')
        .expect(200);

      for (const userId of userIds) {
        const user = listResponse.body.find((u: any) => u.id === userId);
        expect(user).toBeDefined();
        expect(user.role).toMatch(/PUBLIC_RELATIONS|TECHNICAL_OFFICE/);
      }

      console.log('✓ All roles correctly persisted in database');
    });
  });

  describe('Available Roles Endpoint', () => {
    it('should retrieve complete list of available roles', async () => {
      // Setup admin
      const adminEmail = `admin${Date.now()}@example.com`;
      await createUserInDatabase({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: 'AdminPass123!',
        role: 'ADMINISTRATOR',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: adminEmail, password: 'AdminPass123!' })
        .expect(200);

      // Get roles list
      const response = await agent
        .get('/api/admin/roles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('PUBLIC_RELATIONS');
      expect(response.body).toContain('TECHNICAL_OFFICE');
      // Municipality roles endpoint returns only PUBLICRELATIONS and TECHNICAL_OFFICE
      expect(response.body.length).toBe(2);

      console.log(`✓ Retrieved ${response.body.length} municipality roles: ${response.body.join(', ')}`);
    });
  });
});

