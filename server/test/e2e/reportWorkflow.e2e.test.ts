// Mock email service for Story 27 compatibility (email verification)
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';

const app = createApp();

describe('Report Workflow (Tecnico & PR)', () => {
  let citizenAgent: any;
  let prAgent: any;
  let techAgent: any;
  let reportId: number;
  let citizenEmail: string;
  let prEmail: string;
  let techEmail: string;
  const password = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();

    citizenAgent = request.agent(app);
    citizenEmail = `citizen${Date.now()}@example.com`;
    await citizenAgent
      .post('/api/citizen/signup')
      .send({ firstName: 'Cittadino', lastName: 'Test', email: citizenEmail, password })
      .expect(201);
    // Mark as verified for Story 27 compatibility
    await AppDataSource.getRepository(User).update({ email: citizenEmail }, { isVerified: true });
    await citizenAgent
      .post('/api/session')
      .send({ email: citizenEmail, password })
      .expect(200);

    prAgent = request.agent(app);
    prEmail = `pr${Date.now()}@example.com`;
    await request(app)
      .post('/api/citizen/signup')
      .send({ firstName: 'PR', lastName: 'Test', email: prEmail, password })
      .expect(201);
    await AppDataSource.getRepository(User).update({ email: prEmail }, { role: 'PUBLIC_RELATIONS' as any, isVerified: true });
    await prAgent
      .post('/api/session')
      .send({ email: prEmail, password })
      .expect(200);

    techAgent = request.agent(app);
    techEmail = `tech${Date.now()}@example.com`;
    await request(app)
      .post('/api/citizen/signup')
      .send({ firstName: 'Tech', lastName: 'Test', email: techEmail, password })
      .expect(201);
    await AppDataSource.getRepository(User).update({ email: techEmail }, { role: 'LOCAL_PUBLIC_SERVICES' as any, isVerified: true });
    await techAgent
      .post('/api/session')
      .send({ email: techEmail, password })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should allow PR to approve a citizen report and assign to technician', async () => {
    const createRes = await citizenAgent
      .post('/api/reports')
      .field('title', 'Lampione rotto')
      .field('description', 'Lampione spento in via Test')
      .field('category', 'PUBLIC_LIGHTING')
      .field('latitude', '45.0704')
      .field('longitude', '7.6870')
      .field('isAnonymous', 'false')
      .attach('photos', Buffer.from('fake-image'), 'lampione.jpg')
      .expect(201);

    expect(createRes.body.report).toHaveProperty('id');
    reportId = createRes.body.report.id;

    const pendingRes = await prAgent.get('/api/reports/pending').expect(200);
    const found = pendingRes.body.find((r: any) => r.id === reportId);
    expect(found).toBeDefined();

    const tech = await AppDataSource.getRepository(User).findOne({ where: { email: techEmail } });
    expect(tech).toBeTruthy();

    await prAgent
      .post(`/api/reports/${reportId}/approve`)
      .send({ assignedTechnicalId: tech!.id })
      .expect(200);

    const assignedRes = await techAgent.get('/api/reports/assigned').expect(200);
    const assigned = assignedRes.body.find((r: any) => r.id === reportId);
    expect(assigned).toBeDefined();

    await techAgent
      .patch(`/api/reports/${reportId}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await techAgent
      .post(`/api/reports/${reportId}/messages`)
      .send({ content: 'Sto lavorando sul problema.' })
      .expect(201);

    const msgRes = await citizenAgent.get(`/api/reports/${reportId}/messages`).expect(200);
    expect(Array.isArray(msgRes.body)).toBe(true);
    expect(msgRes.body.some((m: any) => m.content.includes('Sto lavorando'))).toBe(true);
  });

  it('should allow PR to reject a report', async () => {
    const createRes = await citizenAgent
      .post('/api/reports')
      .field('title', 'Segnalazione da rifiutare')
      .field('description', 'Test rifiuto')
      .field('category', 'PUBLIC_LIGHTING')
      .field('latitude', '45.0704')
      .field('longitude', '7.6870')
      .field('isAnonymous', 'false')
      .attach('photos', Buffer.from('fake-image'), 'rifiuto.jpg')
      .expect(201);

    const reportId2 = createRes.body.report.id;

    await prAgent
      .post(`/api/reports/${reportId2}/reject`)
      .send({ reason: 'Segnalazione non valida' })
      .expect(200);

    const pendingRes = await prAgent.get('/api/reports/pending').expect(200);
    expect(pendingRes.body.find((r: any) => r.id === reportId2)).toBeUndefined();
  });
});
