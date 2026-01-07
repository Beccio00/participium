jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';
import { ExternalCompany } from '../../src/entities/ExternalCompany';
import { ReportCategory, ReportStatus } from '../../../shared/ReportTypes';
import { Role } from '../../../shared/RoleTypes';

const app = createApp();

describe('Reports Extended APIs E2E', () => {
  const password = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /reports/mine - Citizen Own Reports', () => {
    let citizenAgent: any;
    let citizenEmail: string;
    let reportId1: number;
    let reportId2: number;

    beforeEach(async () => {
      citizenAgent = request.agent(app);
      citizenEmail = `citizen${Date.now()}@example.com`;

      // Register and verify citizen
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'My', lastName: 'Reports', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      // Create reports
      const report1Res = await citizenAgent
        .post('/api/reports')
        .field('title', 'My First Report')
        .field('description', 'Description of my first report')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'photo1.jpg')
        .expect(201);
      reportId1 = report1Res.body.report.id;

      const report2Res = await citizenAgent
        .post('/api/reports')
        .field('title', 'My Anonymous Report')
        .field('description', 'Description of my anonymous report')
        .field('category', ReportCategory.WASTE)
        .field('latitude', '45.0710')
        .field('longitude', '7.6880')
        .field('isAnonymous', 'true')
        .attach('photos', Buffer.from('fake-image'), 'photo2.jpg')
        .expect(201);
      reportId2 = report2Res.body.report.id;
    });

    it('should get all reports created by the citizen', async () => {
      const response = await citizenAgent
        .get('/api/reports/mine')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      const report1 = response.body.find((r: any) => r.id === reportId1);
      const report2 = response.body.find((r: any) => r.id === reportId2);

      expect(report1).toBeDefined();
      expect(report1.title).toBe('My First Report');
      expect(report1.isAnonymous).toBe(false);

      expect(report2).toBeDefined();
      expect(report2.title).toBe('My Anonymous Report');
      expect(report2.isAnonymous).toBe(true);
    });

    it('should show full user info for own reports even if anonymous', async () => {
      const response = await citizenAgent
        .get('/api/reports/mine')
        .expect(200);

      const anonymousReport = response.body.find((r: any) => r.id === reportId2);
      expect(anonymousReport).toBeDefined();
      // User should see their own info even for anonymous reports
      expect(anonymousReport.user).toBeDefined();
      expect(anonymousReport.user.email).toBe(citizenEmail);
    });

    it('should return empty array for user with no reports', async () => {
      // Create another user
      const newAgent = request.agent(app);
      const newEmail = `newuser${Date.now()}@example.com`;
      await newAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'New', lastName: 'User', email: newEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: newEmail }, { isVerified: true });
      await newAgent
        .post('/api/session')
        .send({ email: newEmail, password })
        .expect(200);

      const response = await newAgent
        .get('/api/reports/mine')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/reports/mine')
        .expect(401);
    });

    it('should not allow municipality users to use this endpoint', async () => {
      const prEmail = `pr${Date.now()}@example.com`;
      const prAgent = request.agent(app);
      await prAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'PR', lastName: 'User', email: prEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: prEmail },
        { role: [Role.PUBLIC_RELATIONS] as any, isVerified: true }
      );
      await prAgent
        .post('/api/session')
        .send({ email: prEmail, password })
        .expect(200);

      const response = await prAgent
        .get('/api/reports/mine');

      // Should return 403 because it's for citizens only
      expect(response.status).toBe(403);
    });
  });

  describe('GET /reports/{reportId} - Single Report Details', () => {
    let citizenAgent: any;
    let prAgent: any;
    let techAgent: any;
    let reportId: number;
    let citizenEmail: string;

    beforeEach(async () => {
      citizenAgent = request.agent(app);
      citizenEmail = `citizen${Date.now()}@example.com`;

      // Register and verify citizen
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Report', lastName: 'Owner', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      // Create PR officer
      prAgent = request.agent(app);
      const prEmail = `pr${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'PR', lastName: 'Officer', email: prEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: prEmail },
        { role: [Role.PUBLIC_RELATIONS] as any, isVerified: true }
      );
      await prAgent
        .post('/api/session')
        .send({ email: prEmail, password })
        .expect(200);

      // Create technical officer
      techAgent = request.agent(app);
      const techEmail = `tech${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'Tech', lastName: 'Officer', email: techEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: techEmail },
        { role: [Role.LOCAL_PUBLIC_SERVICES] as any, isVerified: true }
      );
      await techAgent
        .post('/api/session')
        .send({ email: techEmail, password })
        .expect(200);

      // Create a report
      const reportRes = await citizenAgent
        .post('/api/reports')
        .field('title', 'Single Report Test')
        .field('description', 'Testing single report retrieval')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'photo.jpg')
        .expect(201);
      reportId = reportRes.body.report.id;
    });

    it('should get report details as the owner', async () => {
      const response = await citizenAgent
        .get(`/api/reports/${reportId}`)
        .expect(200);

      expect(response.body.id).toBe(reportId);
      expect(response.body.title).toBe('Single Report Test');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('photos');
    });

    it('should get report details as PR officer', async () => {
      const response = await prAgent
        .get(`/api/reports/${reportId}`);

      // PR officer is not allowed to view unless owner or assigned technical
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent report', async () => {
      await citizenAgent
        .get('/api/reports/999999')
        .expect(404);
    });

    it('should not allow other citizens to view the report', async () => {
      // Create another citizen
      const otherAgent = request.agent(app);
      const otherEmail = `other${Date.now()}@example.com`;
      await otherAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Other', lastName: 'Citizen', email: otherEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: otherEmail }, { isVerified: true });
      await otherAgent
        .post('/api/session')
        .send({ email: otherEmail, password })
        .expect(200);

      const response = await otherAgent
        .get(`/api/reports/${reportId}`);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/reports/${reportId}`)
        .expect(401);
    });
  });

  describe('GET /reports/{reportId}/assignable-technicals', () => {
    let prAgent: any;
    let reportId: number;

    beforeEach(async () => {
      // Create citizen and report
      const citizenAgent = request.agent(app);
      const citizenEmail = `citizen${Date.now()}@example.com`;
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Citizen', lastName: 'User', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      const reportRes = await citizenAgent
        .post('/api/reports')
        .field('title', 'Assignable Technicals Test')
        .field('description', 'Testing assignable technicals endpoint')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'photo.jpg')
        .expect(201);
      reportId = reportRes.body.report.id;

      // Create PR officer
      prAgent = request.agent(app);
      const prEmail = `pr${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'PR', lastName: 'Officer', email: prEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: prEmail },
        { role: [Role.PUBLIC_RELATIONS] as any, isVerified: true }
      );
      await prAgent
        .post('/api/session')
        .send({ email: prEmail, password })
        .expect(200);

      // Create some technical officers with appropriate roles for PUBLIC_LIGHTING
      const techEmails = [
        `infra1-${Date.now()}@municipality.com`,
        `infra2-${Date.now()}@municipality.com`,
      ];

      for (const email of techEmails) {
        await request(app)
          .post('/api/citizen/signup')
          .send({ firstName: 'Tech', lastName: 'User', email, password })
          .expect(201);
        await AppDataSource.getRepository(User).update(
          { email },
          { role: [Role.INFRASTRUCTURES] as any, isVerified: true }
        );
      }
    });

    it('should get assignable technicals for a report', async () => {
      const response = await prAgent
        .get(`/api/reports/${reportId}/assignable-technicals`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should have technical officers with INFRASTRUCTURES role (handles PUBLIC_LIGHTING)
      response.body.forEach((tech: any) => {
        expect(tech).toHaveProperty('id');
        expect(tech).toHaveProperty('first_name');
        expect(tech).toHaveProperty('last_name');
        expect(tech).toHaveProperty('email');
        expect(tech).toHaveProperty('role');
      });
    });

    it('should return 404 for non-existent report', async () => {
      await prAgent
        .get('/api/reports/999999/assignable-technicals')
        .expect(404);
    });

    it('should deny access to citizens', async () => {
      const citizenAgent = request.agent(app);
      const citizenEmail = `other-citizen${Date.now()}@example.com`;
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Other', lastName: 'Citizen', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      await citizenAgent
        .get(`/api/reports/${reportId}/assignable-technicals`)
        .expect(403);
    });
  });

  describe('GET /reports/{reportId}/assignable-externals', () => {
    let techAgent: any;
    let reportId: number;
    let techUserId: number;

    beforeEach(async () => {
      // Create citizen and report
      const citizenAgent = request.agent(app);
      const citizenEmail = `citizen${Date.now()}@example.com`;
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Citizen', lastName: 'User', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      const reportRes = await citizenAgent
        .post('/api/reports')
        .field('title', 'Assignable Externals Test')
        .field('description', 'Testing assignable externals endpoint')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'photo.jpg')
        .expect(201);
      reportId = reportRes.body.report.id;

      // Create technical officer
      techAgent = request.agent(app);
      const techEmail = `tech${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'Tech', lastName: 'Officer', email: techEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: techEmail },
        { role: [Role.INFRASTRUCTURES] as any, isVerified: true }
      );
      const techUser = await AppDataSource.getRepository(User).findOne({ where: { email: techEmail } });
      techUserId = techUser!.id;
      await techAgent
        .post('/api/session')
        .send({ email: techEmail, password })
        .expect(200);

      // Create PR and approve the report
      const prAgent = request.agent(app);
      const prEmail = `pr${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'PR', lastName: 'Officer', email: prEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: prEmail },
        { role: [Role.PUBLIC_RELATIONS] as any, isVerified: true }
      );
      await prAgent
        .post('/api/session')
        .send({ email: prEmail, password })
        .expect(200);

      // Approve and assign to technical officer
      await prAgent
        .post(`/api/reports/${reportId}/approve`)
        .send({ assignedTechnicalId: techUserId })
        .expect(200);

      // Create external company with PUBLIC_LIGHTING category
      const companyRepo = AppDataSource.getRepository(ExternalCompany);
      const company = companyRepo.create({
        name: `External Company ${Date.now()}`,
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      });
      await companyRepo.save(company);
    });

    it('should get assignable externals for assigned report', async () => {
      const response = await techAgent
        .get(`/api/reports/${reportId}/assignable-externals`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should have external companies that handle PUBLIC_LIGHTING
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('categories');
        expect(response.body[0].categories).toContain(ReportCategory.PUBLIC_LIGHTING);
      }
    });

    it('should return 404 for non-existent report', async () => {
      await techAgent
        .get('/api/reports/999999/assignable-externals')
        .expect(404);
    });

    it('should deny access to non-assigned technical officers', async () => {
      // Create another technical officer
      const otherTechAgent = request.agent(app);
      const otherTechEmail = `other-tech${Date.now()}@example.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'Other', lastName: 'Tech', email: otherTechEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: otherTechEmail },
        { role: [Role.INFRASTRUCTURES] as any, isVerified: true }
      );
      await otherTechAgent
        .post('/api/session')
        .send({ email: otherTechEmail, password })
        .expect(200);

      const response = await otherTechAgent
        .get(`/api/reports/${reportId}/assignable-externals`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /geocode - Address Geocoding', () => {
    it('should geocode a valid Turin address', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Via Roma, Torino' })
        .expect(200);

      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('bbox');
      expect(response.body).toHaveProperty('zoom');

      // Verify coordinates are within Turin bounds (approximately)
      expect(response.body.latitude).toBeGreaterThan(45.0);
      expect(response.body.latitude).toBeLessThan(45.2);
      expect(response.body.longitude).toBeGreaterThan(7.5);
      expect(response.body.longitude).toBeLessThan(7.8);
    });

    it('should respect zoom parameter', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Piazza Castello, Torino', zoom: 19 })
        .expect(200);

      expect(response.body.zoom).toBe(19);
    });

    it('should return 400 for missing address', async () => {
      await request(app)
        .get('/api/geocode')
        .expect(400);
    });

    it('should return 400 for address too short', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'AB' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid zoom level', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Via Roma, Torino', zoom: 5 });

      // Zoom must be between 12-19
      expect([400, 422]).toContain(response.status);
    });

    it('should return 400 for address outside Turin', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Colosseo, Roma' });

      // Controller returns 400 BadRequest when outside boundaries,
      // but may return 500 if external geocoding service fails
      expect([400, 500]).toContain(response.status);
    });

    it('should return 404 for non-existent address', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Via Inesistente 999999, Torino' });

      expect([404, 500]).toContain(response.status);
    });

    it('should not require authentication', async () => {
      // Geocode should work without authentication
      const response = await request(app)
        .get('/api/geocode')
        .query({ address: 'Porta Nuova, Torino' });

      // Should succeed or fail based on address, not auth
      expect([200, 404, 500]).toContain(response.status);
    });
  });
});
