// Set TELEGRAM_BOT_TOKEN before any imports to ensure telegramService reads it
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token-for-tests';

jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import axios from 'axios';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';
import { Report } from '../../src/entities/Report';
import { ReportCategory, ReportStatus } from '../../../shared/ReportTypes';

const app = createApp();

describe('Telegram Integration E2E', () => {
  const password = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Telegram Account Linking (Web App)', () => {
    let citizenAgent: any;
    let citizenEmail: string;

    beforeEach(async () => {
      citizenAgent = request.agent(app);
      citizenEmail = `citizen${Date.now()}@example.com`;

      // Register and verify citizen
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Telegram', lastName: 'User', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);
    });

    it('should return telegram status as not linked for new user', async () => {
      const response = await citizenAgent
        .get('/api/telegram/status')
        .expect(200);

      expect(response.body).toHaveProperty('linked', false);
      expect(response.body.telegramUsername).toBeNull();
      expect(response.body.telegramId).toBeNull();
    });

    it('should generate a linking token for authenticated user', async () => {
      const response = await citizenAgent
        .post('/api/telegram/generate-token')
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('deepLink');
      expect(response.body).toHaveProperty('message');
      expect(response.body.token.length).toBeGreaterThanOrEqual(6);
      expect(response.body.deepLink).toContain('t.me/');
    });

    it('should require authentication for telegram status', async () => {
      await request(app)
        .get('/api/telegram/status')
        .expect(401);
    });

    it('should require authentication for generate-token', async () => {
      await request(app)
        .post('/api/telegram/generate-token')
        .expect(401);
    });
  });

  describe('Telegram Bot Linking Flow', () => {
    let citizenAgent: any;
    let citizenEmail: string;
    let linkingToken: string;
    const telegramId = `${Date.now()}`;
    const telegramUsername = 'test_telegram_user';

    beforeEach(async () => {
      citizenAgent = request.agent(app);
      citizenEmail = `citizen${Date.now()}@example.com`;

      // Register and verify citizen
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Telegram', lastName: 'User', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      // Generate token
      const tokenResponse = await citizenAgent
        .post('/api/telegram/generate-token')
        .expect(200);
      linkingToken = tokenResponse.body.token;
    });

    it('should link telegram account with valid token (bot request)', async () => {
      const response = await request(app)
        .post('/api/telegram/link')
        .send({
          token: linkingToken,
          telegramId: telegramId,
          telegramUsername: telegramUsername,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('firstName', 'Telegram');
      expect(response.body.user).toHaveProperty('lastName', 'User');

      // Verify linking status
      const statusResponse = await citizenAgent
        .get('/api/telegram/status')
        .expect(200);

      expect(statusResponse.body.linked).toBe(true);
      expect(statusResponse.body.telegramUsername).toBe(telegramUsername);
      expect(statusResponse.body.telegramId).toBe(telegramId);
    });

    it('should reject invalid linking token', async () => {
      await request(app)
        .post('/api/telegram/link')
        .send({
          token: 'INVALID_TOKEN',
          telegramId: telegramId,
          telegramUsername: telegramUsername,
        })
        .expect(404);
    });

    it('should unlink telegram account', async () => {
      // First link the account
      await request(app)
        .post('/api/telegram/link')
        .send({
          token: linkingToken,
          telegramId: telegramId,
          telegramUsername: telegramUsername,
        })
        .expect(200);

      // Then unlink
      await citizenAgent
        .delete('/api/telegram/unlink')
        .expect(200);

      // Verify unlinked
      const statusResponse = await citizenAgent
        .get('/api/telegram/status')
        .expect(200);

      expect(statusResponse.body.linked).toBe(false);
      expect(statusResponse.body.telegramUsername).toBeNull();
      expect(statusResponse.body.telegramId).toBeNull();
    });

    it('should require authentication for unlink', async () => {
      await request(app)
        .delete('/api/telegram/unlink')
        .expect(401);
    });
  });

  describe('Telegram Bot Report APIs', () => {
    let citizenEmail: string;
    let telegramId: string;
    let reportId: number;

    beforeEach(async () => {
      const timestamp = Date.now();
      citizenEmail = `telegram-citizen${timestamp}@example.com`;
      telegramId = `${timestamp}`;

      // Create citizen and link telegram directly in DB
      const citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'TelegramBot', lastName: 'User', email: citizenEmail, password })
        .expect(201);

      await AppDataSource.getRepository(User).update(
        { email: citizenEmail },
        {
          isVerified: true,
          telegram_id: telegramId,
          telegram_username: 'test_bot_user',
        }
      );

      // Login and create a report
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      const reportRes = await citizenAgent
        .post('/api/reports')
        .field('title', 'Telegram Test Report')
        .field('description', 'Report created for telegram test')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'test.jpg')
        .expect(201);

      reportId = reportRes.body.report.id;
    });

    it('should get user reports via telegram ID', async () => {
      const response = await request(app)
        .get(`/api/telegram/${telegramId}/reports`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      const foundReport = response.body.find((r: any) => r.reportId === reportId);
      expect(foundReport).toBeDefined();
      expect(foundReport.title).toBe('Telegram Test Report');
    });

    it('should get single report status via telegram ID', async () => {
      const response = await request(app)
        .get(`/api/telegram/${telegramId}/reports/${reportId}`)
        .expect(200);

      expect(response.body).toHaveProperty('reportId', reportId);
      expect(response.body).toHaveProperty('status', ReportStatus.PENDING_APPROVAL);
      expect(response.body).toHaveProperty('title', 'Telegram Test Report');
    });

    it('should return 404 for non-existent telegram ID', async () => {
      await request(app)
        .get('/api/telegram/999999999/reports')
        .expect(404);
    });

    it('should return 404 for non-existent report ID', async () => {
      await request(app)
        .get(`/api/telegram/${telegramId}/reports/999999`)
        .expect(404);
    });

    it('should not allow access to reports of other users via telegram ID', async () => {
      // Create another user with different telegram ID
      const otherTelegramId = `${Date.now() + 1}`;
      const otherEmail = `other-telegram${Date.now()}@example.com`;

      const otherAgent = request.agent(app);
      await otherAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Other', lastName: 'User', email: otherEmail, password })
        .expect(201);

      await AppDataSource.getRepository(User).update(
        { email: otherEmail },
        {
          isVerified: true,
          telegram_id: otherTelegramId,
          telegram_username: 'other_bot_user',
        }
      );

      // Try to access first user's report with other user's telegram ID
      const response = await request(app)
        .get(`/api/telegram/${otherTelegramId}/reports/${reportId}`);

      // Should return 404 because report doesn't belong to this telegram user
      expect(response.status).toBe(404);
    });
  });

  describe('Telegram Bot Create Report', () => {
    let telegramId: string;
    let axiosSpy: jest.SpyInstance;

    beforeEach(async () => {
      // Ensure BOT token is set for the Telegram service
      process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token';
      const timestamp = Date.now();
      telegramId = `${timestamp}`;
      const citizenEmail = `telegram-create${timestamp}@example.com`;

      // Mock axios.get for Telegram API calls
      axiosSpy = jest.spyOn(axios, 'get').mockImplementation((url: string, config?: any) => {
        if (typeof url === 'string' && url.includes('/getFile')) {
          return Promise.resolve({
            data: { ok: true, result: { file_path: 'photos/mock_file_123.jpg' } },
            status: 200,
          } as any);
        }
        if (typeof url === 'string' && url.includes('/file/')) {
          return Promise.resolve({ 
            data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
            status: 200,
          } as any);
        }
        // For other URLs, call through (or return empty)
        return Promise.resolve({ data: {}, status: 200 } as any);
      });

      // Create citizen and link telegram directly in DB
      const citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'TelegramCreator', lastName: 'User', email: citizenEmail, password })
        .expect(201);

      await AppDataSource.getRepository(User).update(
        { email: citizenEmail },
        {
          isVerified: true,
          telegram_id: telegramId,
          telegram_username: 'telegram_creator',
        }
      );
    });

    afterEach(() => {
      if (axiosSpy) {
        axiosSpy.mockRestore();
      }
    });

    it('should create report via telegram bot', async () => {
      const reportData = {
        telegramId: telegramId,
        title: 'Report from Telegram Bot',
        description: 'This report was created using the Telegram bot interface',
        category: ReportCategory.PUBLIC_LIGHTING,
        latitude: 45.0704,
        longitude: 7.6870,
        photoFileIds: ['AgACAgIAAxkBAAIBZ2abc123'],
        isAnonymous: false,
      };

      const response = await request(app)
        .post('/api/telegram/reports')
        .send(reportData);

      // Log error details if not 201
      if (response.status !== 201) {
        console.log('Create report error:', response.status, response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject report from unlinked telegram ID', async () => {
      const reportData = {
        telegramId: '999999999',
        title: 'Invalid Report',
        description: 'This should fail because telegram ID is not linked',
        category: ReportCategory.PUBLIC_LIGHTING,
        latitude: 45.0704,
        longitude: 7.6870,
        photoFileIds: ['AgACAgIAAxkBAAIBZ2abc123'],
      };

      await request(app)
        .post('/api/telegram/reports')
        .send(reportData)
        .expect(404);
    });

    it('should validate required fields for telegram report', async () => {
      const incompleteData = {
        telegramId: telegramId,
        title: 'Missing fields',
        // Missing description, category, latitude, longitude, photoFileIds
      };

      const response = await request(app)
        .post('/api/telegram/reports')
        .send(incompleteData);

      expect(response.status).toBe(400);
    });
  });
});
