jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';
import { ExternalCompany } from '../../src/entities/ExternalCompany';
import { ReportCategory } from '../../../shared/ReportTypes';
import { Role } from '../../../shared/RoleTypes';

const app = createApp();

describe('External Companies Admin E2E', () => {
  let adminAgent: any;
  const password = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();

    // Create and login administrator
    adminAgent = request.agent(app);
    const adminEmail = `admin${Date.now()}@example.com`;
    await adminAgent
      .post('/api/citizen/signup')
      .send({ firstName: 'Admin', lastName: 'User', email: adminEmail, password })
      .expect(201);
    await AppDataSource.getRepository(User).update(
      { email: adminEmail },
      { role: [Role.ADMINISTRATOR] as any, isVerified: true }
    );
    await adminAgent
      .post('/api/session')
      .send({ email: adminEmail, password })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('External Company CRUD', () => {
    it('should create an external company', async () => {
      const companyData = {
        name: `Test Company ${Date.now()}`,
        categories: [ReportCategory.PUBLIC_LIGHTING],
        platformAccess: true,
      };

      const response = await adminAgent
        .post('/api/admin/external-companies')
        .send(companyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(companyData.name);
      expect(response.body.categories).toContain(ReportCategory.PUBLIC_LIGHTING);
      expect(response.body.platformAccess).toBe(true);
    });

    it('should create an external company without platform access', async () => {
      const companyData = {
        name: `No Access Company ${Date.now()}`,
        categories: [ReportCategory.WASTE, ReportCategory.ROADS_URBAN_FURNISHINGS],
        platformAccess: false,
      };

      const response = await adminAgent
        .post('/api/admin/external-companies')
        .send(companyData)
        .expect(201);

      expect(response.body.platformAccess).toBe(false);
      expect(response.body.categories.length).toBe(2);
    });

    it('should list all external companies', async () => {
      // Create some companies
      await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: `Company A ${Date.now()}`,
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        })
        .expect(201);

      await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: `Company B ${Date.now()}`,
          categories: [ReportCategory.WASTE],
          platformAccess: false,
        })
        .expect(201);

      const response = await adminAgent
        .get('/api/admin/external-companies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should find company in list after creation', async () => {
      const companyName = `Find Company ${Date.now()}`;
      const createRes = await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: companyName,
          categories: [ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS],
          platformAccess: true,
        })
        .expect(201);

      const companyId = createRes.body.id;

      // Verify company exists in the list
      const listRes = await adminAgent
        .get('/api/admin/external-companies')
        .expect(200);

      const foundCompany = listRes.body.find((c: any) => c.id === companyId);
      expect(foundCompany).toBeDefined();
      expect(foundCompany.name).toBe(companyName);
    });

    it('should delete an external company', async () => {
      const companyName = `Delete Company ${Date.now()}`;
      const createRes = await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: companyName,
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: false,
        })
        .expect(201);

      const companyId = createRes.body.id;

      await adminAgent
        .delete(`/api/admin/external-companies/${companyId}`)
        .expect(204);

      // Verify deleted by checking it's not in the list
      const listRes = await adminAgent
        .get('/api/admin/external-companies')
        .expect(200);

      const foundCompany = listRes.body.find((c: any) => c.id === companyId);
      expect(foundCompany).toBeUndefined();
    });

    it('should validate maximum 2 categories', async () => {
      const companyData = {
        name: `Too Many Categories ${Date.now()}`,
        categories: [
          ReportCategory.PUBLIC_LIGHTING,
          ReportCategory.WASTE,
          ReportCategory.ROADS_URBAN_FURNISHINGS,
        ],
        platformAccess: false,
      };

      const response = await adminAgent
        .post('/api/admin/external-companies')
        .send(companyData);

      // Should reject because more than 2 categories
      expect([400, 422]).toContain(response.status);
    });

    it('should require at least 1 category', async () => {
      const companyData = {
        name: `No Categories ${Date.now()}`,
        categories: [],
        platformAccess: false,
      };

      const response = await adminAgent
        .post('/api/admin/external-companies')
        .send(companyData);

      // Should reject because no categories
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('External Maintainers Management', () => {
    let companyId: number;

    beforeEach(async () => {
      // Create a company with platform access for maintainers
      const createRes = await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: `Maintainer Company ${Date.now()}`,
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: true,
        })
        .expect(201);

      companyId = createRes.body.id;
    });

    it('should create maintainer for company', async () => {
      const maintainerData = {
        firstName: 'External',
        lastName: 'Maintainer',
        email: `maintainer${Date.now()}@external.com`,
        password: password,
        externalCompanyId: companyId,
      };

      const response = await adminAgent
        .post('/api/admin/external-maintainers')
        .send({ ...maintainerData, externalCompanyId: companyId.toString() })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(maintainerData.email);
      expect(response.body.firstName).toBe(maintainerData.firstName);
    });

    it('should list all external maintainers', async () => {
      const timestamp = Date.now();
      // Add maintainers to company
      await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'Maintainer',
          lastName: 'One',
          email: `maintainer1-${timestamp}@external.com`,
          password: password,
          externalCompanyId: companyId.toString(),
        })
        .expect(201);

      await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'Maintainer',
          lastName: 'Two',
          email: `maintainer2-${timestamp}@external.com`,
          password: password,
          externalCompanyId: companyId.toString(),
        })
        .expect(201);

      const response = await adminAgent
        .get('/api/admin/external-maintainers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete external maintainer', async () => {
      const createRes = await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'To',
          lastName: 'Delete',
          email: `delete-maintainer${Date.now()}@external.com`,
          password: password,
          externalCompanyId: companyId.toString(),
        })
        .expect(201);

      const maintainerId = createRes.body.id;

      await adminAgent
        .delete(`/api/admin/external-maintainers/${maintainerId}`)
        .expect(204);

      // Verify removed from list
      const listRes = await adminAgent
        .get('/api/admin/external-maintainers')
        .expect(200);

      const found = listRes.body.find((m: any) => m.id === maintainerId);
      expect(found).toBeUndefined();
    });

    it('should return 404 when creating maintainer for non-existent company', async () => {
      await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: `nonexistent${Date.now()}@external.com`,
          password: password,
          externalCompanyId: '999999',
        })
        .expect(404);
    });

    it('should prevent creating maintainer for company without platform access', async () => {
      // Create company without platform access
      const noPlatformRes = await adminAgent
        .post('/api/admin/external-companies')
        .send({
          name: `No Platform ${Date.now()}`,
          categories: [ReportCategory.WASTE],
          platformAccess: false,
        })
        .expect(201);

      const noPlatformCompanyId = noPlatformRes.body.id;

      const response = await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'Should',
          lastName: 'Fail',
          email: `fail${Date.now()}@external.com`,
          password: password,
          externalCompanyId: noPlatformCompanyId,
        });

      // Should reject because company has no platform access
      expect([400, 403, 422]).toContain(response.status);
    });

    it('should allow maintainer to login after creation', async () => {
      const email = `login-test${Date.now()}@external.com`;

      await adminAgent
        .post('/api/admin/external-maintainers')
        .send({
          firstName: 'Login',
          lastName: 'Test',
          email: email,
          password: password,
          externalCompanyId: companyId.toString(),
        })
        .expect(201);

      // Maintainer should be able to login
      const maintainerAgent = request.agent(app);
      const loginRes = await maintainerAgent
        .post('/api/session')
        .send({ email: email, password: password })
        .expect(200);

      expect(loginRes.body.user.email).toBe(email);
      expect(loginRes.body.user.role).toContain(Role.EXTERNAL_MAINTAINER);
    });
  });

  describe('Authorization', () => {
    it('should deny access to non-admin users', async () => {
      // Create a citizen
      const citizenEmail = `citizen${Date.now()}@example.com`;
      const citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/citizen/signup')
        .send({ firstName: 'Citizen', lastName: 'User', email: citizenEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password })
        .expect(200);

      // Try to access external companies endpoint
      await citizenAgent
        .get('/api/admin/external-companies')
        .expect(403);

      await citizenAgent
        .post('/api/admin/external-companies')
        .send({
          name: 'Unauthorized',
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: false,
        })
        .expect(403);
    });

    it('should deny access to PR officers', async () => {
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

      await prAgent
        .get('/api/admin/external-companies')
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/external-companies')
        .expect(401);

      await request(app)
        .post('/api/admin/external-companies')
        .send({
          name: 'Unauthenticated',
          categories: [ReportCategory.PUBLIC_LIGHTING],
          platformAccess: false,
        })
        .expect(401);
    });
  });
});
