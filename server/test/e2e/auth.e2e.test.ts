// Mock email service for Story 27 compatibility (email verification)
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';

const app = createApp();

describe('User Registration and Authentication Flow', () => {
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

      const signupResponse = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body).toHaveProperty('firstName', userData.firstName);
      expect(signupResponse.body).toHaveProperty('lastName', userData.lastName);
      expect(signupResponse.body).toHaveProperty('email', userData.email);
      expect(signupResponse.body).not.toHaveProperty('password');

      // Mark as verified for Story 27 compatibility
      await AppDataSource.getRepository(User).update({ email: userData.email }, { isVerified: true });
      await new Promise(resolve => setTimeout(resolve, 300));

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

      const sessionResponse = await agent
        .get('/api/session/current')
        .expect(200);

      expect(sessionResponse.body.authenticated).toBe(true);
      expect(sessionResponse.body.user).toHaveProperty('email', userData.email);
      expect(sessionResponse.body.user).toHaveProperty('firstName', userData.firstName);

      await agent
        .delete('/api/session/current')
        .expect(200);

      const logoutSessionResponse = await agent
        .get('/api/session/current')
        .expect(200);

      expect(logoutSessionResponse.body.authenticated).toBe(false);
      expect(logoutSessionResponse.body.user).toBeUndefined();
    });

    it('should prevent login with incorrect password', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'Bob',
        lastName: 'Smith',
        email: `bob${timestamp}@example.com`,
        password: 'CorrectPass123!',
      };

      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 300));

      await request(app)
        .post('/api/session')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should maintain session across multiple requests', async () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'Carol',
        lastName: 'Davis',
        email: `carol${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      // Mark as verified for Story 27 compatibility
      await AppDataSource.getRepository(User).update({ email: userData.email }, { isVerified: true });
      await new Promise(resolve => setTimeout(resolve, 300));

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      for (let i = 0; i < 3; i++) {
        const response = await agent
          .get('/api/session/current')
          .expect(200);
        expect(response.body.authenticated).toBe(true);
        expect(response.body.user.email).toBe(userData.email);
      }
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

      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
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
    });
  });
});


