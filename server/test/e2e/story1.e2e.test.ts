import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase } from '../helpers/testSetup';

const app = createApp();

/**
 * Story 1 E2E Tests - Complete User Registration and Authentication Flow
 * 
 * This test suite validates the entire user journey from registration to logout:
 * 1. User registers as a new citizen
 * 2. User logs in with credentials
 * 3. User accesses their session information
 * 4. User logs out successfully
 */
describe('Story 1 E2E - User Registration and Authentication Flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Complete User Journey: Register → Login → Session → Logout', () => {
    it('should complete the full user authentication lifecycle', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: `alice${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // Step 1: User Registration
      console.log('Step 1: Registering new user...');
      const signupResponse = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body).toHaveProperty('firstName', userData.firstName);
      expect(signupResponse.body).toHaveProperty('lastName', userData.lastName);
      expect(signupResponse.body).toHaveProperty('email', userData.email);
      expect(signupResponse.body).not.toHaveProperty('password'); // Password should not be returned
      console.log('✓ User registered successfully');

      // Wait a bit for database write to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: User Login
      console.log('Step 2: Logging in with credentials...');
      const agent = request.agent(app);
      const loginResponse = await agent
        .post('/api/session')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.user).toHaveProperty('firstName', userData.firstName);
      expect(loginResponse.body.user).toHaveProperty('email', userData.email);
      console.log('✓ User logged in successfully');

      // Step 3: Check Session Information
      console.log('Step 3: Checking session information...');
      const sessionResponse = await agent
        .get('/api/session/current')
        .expect(200);

      expect(sessionResponse.body.authenticated).toBe(true);
      expect(sessionResponse.body.user).toHaveProperty('email', userData.email);
      expect(sessionResponse.body.user).toHaveProperty('firstName', userData.firstName);
      console.log('✓ Session information retrieved successfully');

      // Step 4: User Logout
      console.log('Step 4: Logging out...');
      await agent
        .delete('/api/session/current')
        .expect(200);
      console.log('✓ User logged out successfully');

      // Step 5: Verify Session is Cleared
      console.log('Step 5: Verifying session is cleared...');
      const logoutSessionResponse = await agent
        .get('/api/session/current')
        .expect(200);

      expect(logoutSessionResponse.body.authenticated).toBe(false);
      expect(logoutSessionResponse.body.user).toBeUndefined();
      console.log('✓ Session cleared successfully');

      console.log('🎉 Complete user journey test passed!');
    });

    it('should prevent login with incorrect password', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'Bob',
        lastName: 'Smith',
        email: `bob${timestamp}@example.com`,
        password: 'CorrectPass123!',
      };

      // Step 1: Register user
      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Try to login with wrong password
      await request(app)
        .post('/api/session')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      console.log('✓ Incorrect password correctly rejected');
    });

    it('should maintain session across multiple requests', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'Carol',
        lastName: 'Davis',
        email: `carol${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // Register and login
      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 300));

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // Make multiple requests with the same session
      for (let i = 0; i < 3; i++) {
        const response = await agent
          .get('/api/session/current')
          .expect(200);

        expect(response.body.authenticated).toBe(true);
        expect(response.body.user.email).toBe(userData.email);
      }

      console.log('✓ Session maintained across multiple requests');
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle duplicate registration attempts', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'David',
        lastName: 'Wilson',
        email: `david${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // First registration should succeed
      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Duplicate registration correctly prevented');
    });

    it('should handle login before registration', async () => {
      const response = await request(app)
        .post('/api/session')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Login with non-existent user correctly rejected');
    });

    it('should handle logout without login', async () => {
      const response = await request(app)
        .delete('/api/session/current')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Logout without login correctly rejected');
    });
  });

  describe('Data Validation', () => {
    it('should reject registration with missing fields', async () => {
      const incompleteData = {
        firstName: 'Eve',
        // Missing lastName, email, password
      };

      const response = await request(app)
        .post('/api/citizen/signup')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Incomplete registration data correctly rejected');
    });

    it('should reject registration with empty email', async () => {
      const invalidData = {
        firstName: 'Frank',
        lastName: 'Miller',
        email: '',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/citizen/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Empty email correctly rejected');
    });
  });
});

