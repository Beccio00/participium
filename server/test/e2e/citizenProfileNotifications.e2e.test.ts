// Mock email service for Story 27 compatibility (email verification)
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';

const app = createApp();

describe('Citizen Profile & Notifications', () => {
  let agent: any;
  let citizenEmail: string;
  let citizenPassword = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();
    agent = request.agent(app);
    citizenEmail = `citizen${Date.now()}@example.com`;
    // Signup
    await agent
      .post('/api/citizen/signup')
      .send({
        firstName: 'Mario',
        lastName: 'Rossi',
        email: citizenEmail,
        password: citizenPassword,
      })
      .expect(201);
    // Mark as verified for Story 27 compatibility
    await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
    // Login
    await agent
      .post('/api/session')
      .send({ email: citizenEmail, password: citizenPassword })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should get and update citizen profile', async () => {
    // Get profile
    const getRes = await agent.get('/api/citizen/me').expect(200);
    expect(getRes.body).toHaveProperty('email', citizenEmail);
    // Update profile
    const patchRes = await agent
      .patch('/api/citizen/me')
      .send({ firstName: 'Luigi', lastName: 'Verdi' })
      .expect(200);
    expect(patchRes.body).toHaveProperty('firstName', 'Luigi');
    expect(patchRes.body).toHaveProperty('lastName', 'Verdi');
  });

  it('should upload and delete profile photo', async () => {
    const uploadRes = await agent
      .post('/api/citizen/me/photo')
      .attach('photo', Buffer.from('fake-image'), 'profile.jpg')
      .expect(201);
    expect(uploadRes.body.photo).toHaveProperty('url');
    await agent.delete('/api/citizen/me/photo').expect(204);
  });

  it('should get notifications and mark as read', async () => {
    const notificationsRes = await agent.get('/api/notifications').expect(200);
    expect(Array.isArray(notificationsRes.body)).toBe(true);
    if (notificationsRes.body.length > 0) {
      const notificationId = notificationsRes.body[0].id;
      await agent
        .patch(`/api/notifications/${notificationId}/read`)
        .expect(200);
    }
  });
});
