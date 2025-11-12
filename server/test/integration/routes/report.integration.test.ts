import request from 'supertest';
import { createApp } from '../../../src/app';
import { cleanDatabase, disconnectDatabase } from '../../helpers/testSetup';
import { createUserInDatabase } from '../../helpers/testUtils';
import { ReportCategory } from '../../../../shared/ReportTypes';

const app = createApp();

describe('Report Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/reports - Create Report', () => {
    describe('Success scenarios', () => {
      it('should successfully create a report with valid data', async () => {
        // Arrange - Create a citizen user
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        // Login to get session
        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Broken street light',
          description: 'The street light on Main St is not working',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo1.jpg',
              filename: 'photo1.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Report created successfully');
        expect(response.body).toHaveProperty('id');
        expect(typeof response.body.id).toBe('number');
      });

      it('should create an anonymous report', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Pothole on road',
          description: 'Large pothole needs fixing',
          category: 'ROADS_URBAN_FURNISHINGS' as ReportCategory,
          latitude: 45.0704,
          longitude: 7.6870,
          isAnonymous: true, // Anonymous report
          photos: [
            {
              id: 1,
              url: 'https://example.com/pothole.jpg',
              filename: 'pothole.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      it('should create report with multiple photos', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Damaged playground',
          description: 'Playground equipment is damaged and unsafe',
          category: 'PUBLIC_GREEN_AREAS_PLAYGROUNDS' as ReportCategory,
          latitude: 45.0705,
          longitude: 7.6871,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo1.jpg',
              filename: 'photo1.jpg',
            },
            {
              id: 2,
              url: 'https://example.com/photo2.jpg',
              filename: 'photo2.jpg',
            },
            {
              id: 3,
              url: 'https://example.com/photo3.jpg',
              filename: 'photo3.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      it('should create report with all valid categories', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const categories: ReportCategory[] = [
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

        // Act & Assert - Test each category
        for (const category of categories) {
          const reportData = {
            title: `Test report for ${category}`,
            description: `Testing category: ${category}`,
            category: category,
            latitude: 45.0703,
            longitude: 7.6869,
            isAnonymous: false,
            photos: [
              {
                id: 1,
                url: 'https://example.com/test.jpg',
                filename: 'test.jpg',
              },
            ],
          };

          const response = await agent.post('/api/reports').send(reportData);
          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('id');
        }
      });
    });

    describe('Validation - Missing required fields', () => {
      it('should return 400 when title is missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          // title: missing
          description: 'Test description',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('message', 'Missing required fields');
      });

      it('should return 400 when description is missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          // description: missing
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });

      it('should return 400 when category is missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          description: 'Test description',
          // category: missing
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });

      it('should return 400 when latitude is missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          description: 'Test description',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          // latitude: missing
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });

      it('should return 400 when longitude is missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          description: 'Test description',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          // longitude: missing
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });

      it('should return 400 when photos are missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          description: 'Test description',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          // photos: missing
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });

      it('should return 400 when multiple fields are missing', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          // title: missing
          // description: missing
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          // photos: missing
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Bad Request');
      });
    });

    describe('Authentication scenarios', () => {
      it('should return 401 when not logged in', async () => {
        // Arrange
        const reportData = {
          title: 'Test report',
          description: 'Test description',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act - No login, direct request
        const response = await request(app)
          .post('/api/reports')
          .send(reportData);

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized');
      });
    });

    describe('Edge cases', () => {
      it('should handle latitude and longitude as 0', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report at 0,0',
          description: 'Testing edge case',
          category: 'OTHER' as ReportCategory,
          latitude: 0, // Edge case: 0 is valid
          longitude: 0, // Edge case: 0 is valid
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      it('should handle negative latitude and longitude', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Test report',
          description: 'Testing negative coordinates',
          category: 'OTHER' as ReportCategory,
          latitude: -45.0703,
          longitude: -7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        // Act
        const response = await agent.post('/api/reports').send(reportData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });
    });
  });

  describe('GET /api/reports - Get Reports', () => {
    describe('Success scenarios', () => {
      it('should return empty array when no approved reports exist', async () => {
        // Arrange
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        // Act
        const response = await agent.get('/api/reports');

        // Assert
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('should not return pending approval reports', async () => {
        // Arrange - Create a report (which will be in PENDING_APPROVAL status)
        const citizenEmail = `citizen-${Date.now()}@example.com`;
        await createUserInDatabase({
          email: citizenEmail,
          password: 'Citizen123!',
          role: 'CITIZEN',
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: citizenEmail, password: 'Citizen123!' })
          .expect(200);

        const reportData = {
          title: 'Pending report',
          description: 'This should not be visible',
          category: 'PUBLIC_LIGHTING' as ReportCategory,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [
            {
              id: 1,
              url: 'https://example.com/photo.jpg',
              filename: 'photo.jpg',
            },
          ],
        };

        await agent.post('/api/reports').send(reportData).expect(201);

        // Act - Get reports
        const response = await agent.get('/api/reports');

        // Assert - Should be empty because report is in PENDING_APPROVAL status
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });

    describe('Authentication scenarios', () => {
      it('should return 401 when not logged in', async () => {
        // Act - No login, direct request
        const response = await request(app).get('/api/reports');

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized');
      });
    });
  });
});

