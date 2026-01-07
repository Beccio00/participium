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

describe('Internal Notes E2E', () => {
  const password = 'Test1234!';
  let citizenAgent: any;
  let prAgent: any;
  let techAgent: any;
  let externalAgent: any;
  let reportId: number;
  let techUserId: number;
  let externalCompanyId: number;
  let externalMaintainerId: number;

  beforeEach(async () => {
    await cleanDatabase();

    // Create citizen and report
    citizenAgent = request.agent(app);
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
      .field('title', 'Internal Notes Test Report')
      .field('description', 'Testing internal notes functionality')
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

    // Create external company with platform access
    const companyRepo = AppDataSource.getRepository(ExternalCompany);
    const company = companyRepo.create({
      name: `External Company ${Date.now()}`,
      categories: [ReportCategory.PUBLIC_LIGHTING],
      platformAccess: true,
    });
    const savedCompany = await companyRepo.save(company);
    externalCompanyId = savedCompany.id;

    // Create external maintainer
    externalAgent = request.agent(app);
    const externalEmail = `external${Date.now()}@external.com`;
    await request(app)
      .post('/api/citizen/signup')
      .send({ firstName: 'External', lastName: 'Maintainer', email: externalEmail, password })
      .expect(201);
    await AppDataSource.getRepository(User).update(
      { email: externalEmail },
      {
        role: [Role.EXTERNAL_MAINTAINER] as any,
        externalCompanyId: externalCompanyId,
        isVerified: true,
      }
    );
    const externalUser = await AppDataSource.getRepository(User).findOne({ where: { email: externalEmail } });
    externalMaintainerId = externalUser!.id;
    await externalAgent
      .post('/api/session')
      .send({ email: externalEmail, password })
      .expect(200);

    // Approve report and assign to technical officer
    await prAgent
      .post(`/api/reports/${reportId}/approve`)
      .send({ assignedTechnicalId: techUserId })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Technical Staff Internal Notes', () => {
    it('should add internal note as technical officer', async () => {
      const response = await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Verified on site - requires emergency intervention' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', 'Verified on site - requires emergency intervention');
      expect(response.body).toHaveProperty('authorId', techUserId);
      expect(response.body).toHaveProperty('authorName');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should get internal notes as technical officer', async () => {
      // Add some notes
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'First internal note' })
        .expect(201);

      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Second internal note' })
        .expect(201);

      const response = await techAgent
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('authorId');
      expect(response.body[0]).toHaveProperty('authorName');
    });

    it('should return empty array for report with no internal notes', async () => {
      const response = await techAgent
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('External Maintainer Internal Notes', () => {
    beforeEach(async () => {
      // Assign report to external maintainer
      await techAgent
        .post(`/api/reports/${reportId}/assign-external`)
        .send({
          externalCompanyId: externalCompanyId,
          externalMaintainerId: externalMaintainerId,
        })
        .expect(200);
    });

    it('should add internal note as external maintainer', async () => {
      const response = await externalAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'External maintainer note - parts ordered' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('External maintainer note - parts ordered');
    });

    it('should get internal notes as external maintainer', async () => {
      // Tech adds a note
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Tech note for external' })
        .expect(201);

      // External can read it
      const response = await externalAgent
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow both tech and external to exchange notes', async () => {
      // Tech creates note
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Please check the electrical panel' })
        .expect(201);

      // External responds
      await externalAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Electrical panel checked, issue identified' })
        .expect(201);

      // Tech responds again
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Proceed with repair' })
        .expect(201);

      // Both should see all notes
      const techNotes = await techAgent
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(200);

      const externalNotes = await externalAgent
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(200);

      expect(techNotes.body.length).toBe(3);
      expect(externalNotes.body.length).toBe(3);
    });
  });

  describe('Citizen Access Restrictions', () => {
    it('should prevent citizen from reading internal notes', async () => {
      // Tech adds a note
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Internal discussion - not for citizen' })
        .expect(201);

      // Citizen should not be able to read
      const response = await citizenAgent
        .get(`/api/reports/${reportId}/internal-notes`);

      expect(response.status).toBe(403);
    });

    it('should prevent citizen from adding internal notes', async () => {
      const response = await citizenAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Citizen should not add internal notes' });

      expect(response.status).toBe(403);
    });
  });

  describe('PR Officer Access', () => {
    it('should NOT allow PR officer to read internal notes (only assigned officers can)', async () => {
      await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Note visible to PR' })
        .expect(201);

      // PR officers are NOT assigned to the report, so they cannot access internal notes
      const response = await prAgent
        .get(`/api/reports/${reportId}/internal-notes`);

      expect(response.status).toBe(403);
    });

    it('should NOT allow PR officer to add internal notes (only assigned officers can)', async () => {
      // PR officers are NOT assigned to the report, so they cannot add internal notes
      const response = await prAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'PR coordination note' });

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should reject empty content', async () => {
      const response = await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: '' });

      expect([400, 422]).toContain(response.status);
    });

    it('should reject content too long', async () => {
      const longContent = 'a'.repeat(2001); // Max is 2000 characters

      const response = await techAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: longContent });

      expect([400, 422]).toContain(response.status);
    });

    it('should return 404 for non-existent report', async () => {
      await techAgent
        .get('/api/reports/999999/internal-notes')
        .expect(404);

      await techAgent
        .post('/api/reports/999999/internal-notes')
        .send({ content: 'Should fail' })
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      await request(app)
        .get(`/api/reports/${reportId}/internal-notes`)
        .expect(401);

      await request(app)
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Should fail' })
        .expect(401);
    });

    it('should deny access to unrelated technical officer', async () => {
      // Create another tech officer not assigned to this report
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

      // Should be denied because not assigned to this report
      const response = await otherTechAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Should fail - not assigned' });

      expect(response.status).toBe(403);
    });

    it('should deny access to unrelated external maintainer', async () => {
      // Create another external company and maintainer
      const companyRepo = AppDataSource.getRepository(ExternalCompany);
      const otherCompany = companyRepo.create({
        name: `Other Company ${Date.now()}`,
        categories: [ReportCategory.WASTE],
        platformAccess: true,
      });
      const savedOtherCompany = await companyRepo.save(otherCompany);

      const otherExternalAgent = request.agent(app);
      const otherExternalEmail = `other-external${Date.now()}@external.com`;
      await request(app)
        .post('/api/citizen/signup')
        .send({ firstName: 'Other', lastName: 'External', email: otherExternalEmail, password })
        .expect(201);
      await AppDataSource.getRepository(User).update(
        { email: otherExternalEmail },
        {
          role: [Role.EXTERNAL_MAINTAINER] as any,
          externalCompanyId: savedOtherCompany.id,
          isVerified: true,
        }
      );
      await otherExternalAgent
        .post('/api/session')
        .send({ email: otherExternalEmail, password })
        .expect(200);

      // Should be denied because not assigned to this report
      const response = await otherExternalAgent
        .post(`/api/reports/${reportId}/internal-notes`)
        .send({ content: 'Should fail - not assigned' });

      expect(response.status).toBe(403);
    });
  });
});
