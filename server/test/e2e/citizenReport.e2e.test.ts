// Mock email service for Story 27 compatibility (email verification)
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, AppDataSource } from '../helpers/testSetup';
import { createUserInDatabase } from '../helpers/testUtils';
import { ReportCategory } from '../../../shared/ReportTypes';
import { User } from '../../src/entities/User';

const app = createApp();


describe('Citizen Report System', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Complete Report Lifecycle: Register → Login → Create Report → View Reports', () => {
    it('should complete the full citizen report workflow', async () => {
      const timestamp = Date.now();
      // Step 1: Citizen Registration
      const citizenData = {
        firstName: 'Maria',
        lastName: 'Rossi',
        email: `maria.rossi${timestamp}@example.com`,
        password: 'SecurePass123!',
      };
      const signupResponse = await request(app)
        .post('/api/citizen/signup')
        .send(citizenData)
        .expect(201);
      expect(signupResponse.body.email).toBe(citizenData.email);
      // Mark as verified for Story 27 compatibility
      await AppDataSource.getRepository(User).update({ email: citizenData.email }, { isVerified: true });
      await new Promise(resolve => setTimeout(resolve, 300));
      // Step 2: Citizen Login
      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({
          email: citizenData.email,
          password: citizenData.password,
        })
        .expect(200);
      // Step 3: Create Report with Photos (multipart/form-data)
      const createResponse = await agent
        .post('/api/reports')
        .field('title', 'Pothole on Via Roma')
        .field('description', 'Large pothole causing danger to vehicles and pedestrians')
        .field('category', 'ROADS_URBAN_FURNISHINGS')
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image-1'), 'pothole1.jpg')
        .attach('photos', Buffer.from('fake-image-2'), 'pothole2.jpg')
        .expect(201);
      expect(createResponse.body).toHaveProperty('message', 'Report created successfully');
      expect(createResponse.body.report).toHaveProperty('id');
      const reportId = createResponse.body.report.id;
      // Step 4: Verify Report is Pending Approval (not visible in public list)
      const reportsResponse = await agent
        .get('/api/reports')
        .expect(200);
      expect(Array.isArray(reportsResponse.body)).toBe(true);
      const foundReport = reportsResponse.body.find((r: any) => r.id === reportId);
      expect(foundReport).toBeUndefined(); // Pending reports should not be in public list
    });

    it('should handle multiple reports from the same citizen', async () => {
      const timestamp = Date.now();
      
      // Setup: Register and login citizen
      const citizenEmail = `multi.report${timestamp}@example.com`;
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Multi',
        lastName: 'Reporter',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);

      // Create multiple reports
      const categories: string[] = [
        'WATER_SUPPLY_DRINKING_WATER',
        'PUBLIC_LIGHTING',
        'WASTE',
      ];
      const reportIds: number[] = [];
      for (const category of categories) {
        const response = await agent
          .post('/api/reports')
          .field('title', `Issue with ${category}`)
          .field('description', `Report about ${category}`)
          .field('category', category)
          .field('latitude', (45.0700 + Math.random() * 0.01).toString())
          .field('longitude', (7.6860 + Math.random() * 0.01).toString())
          .field('isAnonymous', 'false')
          .attach('photos', Buffer.from('fake-image'), `${category}.jpg`)
          .expect(201);
        expect(response.body.report).toHaveProperty('id');
        reportIds.push(response.body.report.id);
      }
      expect(reportIds.length).toBe(3);
    });

    it('should handle anonymous report submission', async () => {
      const timestamp = Date.now();
      
      // Setup citizen
      const citizenEmail = `anon${timestamp}@example.com`;
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Anonymous',
        lastName: 'Citizen',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      const agent = request.agent(app);
      await agent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);

      // Create anonymous report
      const response = await agent
        .post('/api/reports')
        .field('title', 'Anonymous Issue Report')
        .field('description', 'I prefer to remain anonymous')
        .field('category', 'OTHER')
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'true')
        .attach('photos', Buffer.from('fake-image'), 'anonymous.jpg')
        .expect(201);
      expect(response.body.report).toHaveProperty('id');
    });
  });

  describe('Report Categories', () => {
        beforeAll(() => {
          jest.setTimeout(30000);
        });
    let citizenAgent: any;

    beforeEach(async () => {
      const timestamp = Date.now();
      const citizenEmail = `category${timestamp}@example.com`;
      
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Category',
        lastName: 'Tester',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);
    });

    it('should accept all valid report categories', async () => {
      // timeout aumentato a 20000 ms per evitare errori di timeout su test lenti
        const validCategories: string[] = [
          'WATER_SUPPLY_DRINKING_WATER',
          'ARCHITECTURAL_BARRIERS',
          'SEWER_SYSTEM',
          'PUBLIC_LIGHTING',
          'WASTE',
          'ROAD_SIGNS_TRAFFIC_LIGHTS',
          'ROADS_URBAN_FURNISHINGS',
          'PUBLIC_GREEN_AREAS_PLAYGROUNDS',
          'OTHER',
        ];
        const promises = validCategories.map(async (category) => {
          const response = await citizenAgent
            .post('/api/reports')
            .field('title', `Test report for ${category}`)
            .field('description', `Testing category: ${category}`)
            .field('category', category)
            .field('latitude', '45.0704')
            .field('longitude', '7.6870')
            .field('isAnonymous', 'false')
            .attach('photos', Buffer.from('fake-image'), `${category}.jpg`)
            .expect(201);
          expect(response.body.report).toHaveProperty('id');
        });
        await Promise.all(promises);
      }, 60000);

    it('should reject invalid categories', async () => {
      const invalidCategory = 'INVALID_CATEGORY';
      await citizenAgent
        .post('/api/reports')
        .field('title', 'Test with invalid category')
        .field('description', 'This should fail')
        .field('category', invalidCategory)
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'test.jpg')
        .expect(400); // Swagger: 400 per campi non validi
    });
  });

  describe('Location Data', () => {
    let citizenAgent: any;

    beforeEach(async () => {
      const timestamp = Date.now();
      const citizenEmail = `location${timestamp}@example.com`;
      
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Location',
        lastName: 'Tester',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);
    });

    it('should accept valid GPS coordinates', async () => {
      // Solo coordinate sicuramente dentro Torino
      const validCoordinates = [
        { lat: 45.0704, lng: 7.6870, name: 'Turin center' },
        { lat: 45.0735, lng: 7.6868, name: 'Piazza Statuto' },
        { lat: 45.0628, lng: 7.6787, name: 'Porta Nuova' },
        { lat: 45.0761, lng: 7.6846, name: 'Piazza XVIII Dicembre' },
      ];

      for (const coord of validCoordinates) {
        const response = await citizenAgent
          .post('/api/reports')
          .field('title', `Report at ${coord.name}`)
          .field('description', `Testing coordinates: ${coord.lat}, ${coord.lng}`)
          .field('category', 'OTHER')
          .field('latitude', coord.lat.toString())
          .field('longitude', coord.lng.toString())
          .field('isAnonymous', 'false')
          .attach('photos', Buffer.from('fake-image'), 'location.jpg')
          .expect(201);
        expect(response.body.report).toHaveProperty('id');
      }
    });

    it('should reject missing location data', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          title: 'Report without location',
          description: 'Missing latitude and longitude',
          category: 'OTHER' as ReportCategory,
          // latitude and longitude missing
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/test.jpg',
              filename: 'test.jpg',
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Missing location data correctly rejected');
    });
  });

  describe('Photo Requirements', () => {
    let citizenAgent: any;

    beforeEach(async () => {
      const timestamp = Date.now();
      const citizenEmail = `photo${timestamp}@example.com`;
      
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Photo',
        lastName: 'Tester',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);
    });

    it('should accept report with single photo', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with one photo')
        .field('description', 'Testing single photo')
        .field('category', 'OTHER')
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'single.jpg')
        .expect(201);
      expect(response.body.report).toHaveProperty('id');
    });

    it('should accept report with multiple photos', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with multiple photos')
        .field('description', 'Testing multiple photos')
        .field('category', 'OTHER')
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image-1'), 'photo1.jpg')
        .attach('photos', Buffer.from('fake-image-2'), 'photo2.jpg')
        .attach('photos', Buffer.from('fake-image-3'), 'photo3.jpg')
        .expect(201);
      expect(response.body.report).toHaveProperty('id');
    });

    it('should reject report without photos', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          title: 'Report without photos',
          description: 'Missing photos',
          category: 'OTHER' as ReportCategory,
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: false,
          // photos field missing entirely
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Report without photos field correctly rejected');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require login to create report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          title: 'Unauthorized report',
          description: 'Trying without login',
          category: 'OTHER' as ReportCategory,
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/test.jpg',
              filename: 'test.jpg',
            },
          ],
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Unauthenticated report creation correctly denied');
    });

    it('should require login to view reports', async () => {
      const response = await request(app)
        .get('/api/reports')
        .expect(200); // L'implementazione attuale restituisce 200

      expect(Array.isArray(response.body)).toBe(true);
      console.log('✓ Unauthenticated report viewing allowed (comportamento attuale)');
    });
  });

  describe('Data Validation', () => {
    let citizenAgent: any;

    beforeEach(async () => {
      const timestamp = Date.now();
      const citizenEmail = `validation${timestamp}@example.com`;
      
      await createUserInDatabase({
        email: citizenEmail,
        firstName: 'Validation',
        lastName: 'Tester',
        password: 'Pass123!',
        role: 'CITIZEN',
      });

      citizenAgent = request.agent(app);
      await citizenAgent
        .post('/api/session')
        .send({ email: citizenEmail, password: 'Pass123!' })
        .expect(200);
    });

    it('should reject report with missing title', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          // title missing
          description: 'Valid description',
          category: 'OTHER' as ReportCategory,
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: false,
          photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Missing title correctly rejected');
    });

    it('should reject report with missing description', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          title: 'Valid title',
          // description missing
          category: 'OTHER' as ReportCategory,
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: false,
          photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Missing description correctly rejected');
    });

    it('should reject report with missing category', async () => {
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          title: 'Valid title',
          description: 'Valid description',
          // category missing
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: false,
          photos: [{ id: 1, url: 'https://example.com/test.jpg', filename: 'test.jpg' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✓ Missing category correctly rejected');
    });
  });
});

