import request from 'supertest';
import express, { Express, Router } from 'express';

// Mock all route imports to return router instances
jest.mock('../../src/routes/authRoutes', () => express.Router());
jest.mock('../../src/routes/citizenRoutes', () => express.Router());  
jest.mock('../../src/routes/adminRoutes', () => express.Router());
jest.mock('../../src/routes/reportRoutes', () => express.Router());

// Mock config and other dependencies
jest.mock('../../src/config/passport', () => ({
  configurePassport: jest.fn()
}));
jest.mock('../../prisma/generated/client');

// Import createApp after mocking
import { createApp } from '../../src/app';

describe('App', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('Root endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('auth');
      expect(response.body.endpoints).toHaveProperty('citizens');
      expect(response.body.endpoints).toHaveProperty('admin');
      expect(response.body.endpoints).toHaveProperty('docs');
    });

    it('should return correct API name', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.message).toBe('Participium API');
    });

    it('should return version information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.version).toBe('1.1.0');
    });
  });
});