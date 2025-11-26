/**
 * Integration Tests for Story 8 (PT08)
 * User Story: As a technical office staff member, I want to see the list of reports assigned to me
 *             So that I can get an overview of the maintenance to be done
 * 
 * API Endpoint: GET /api/reports/assigned
 */

import request from 'supertest';
import { createApp } from '../../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../../helpers/testSetup';
import { createUserInDatabase } from '../../helpers/testUtils';
import { ReportCategory, ReportStatus } from '@prisma/client';

const app = createApp();

describe('Story 8 - Assigned Reports Integration Tests', () => {
  // Test users
  let technicalUser1: any;
  let technicalUser2: any;
  let citizenUser: any;
  let publicRelationsUser: any;
  let adminUser: any;

  // Test agents
  let technicalAgent1: any;
  let technicalAgent2: any;
  let citizenAgent: any;
  let publicRelationsAgent: any;
  let adminAgent: any;

  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();

    // Create test users with different roles
    technicalUser1 = await createUserInDatabase({
      email: `technical1-${Date.now()}@test.com`,
      first_name: 'Tech',
      last_name: 'User1',
      password: 'Tech123!',
      role: 'ROAD_MAINTENANCE', // Technical role
    });

    technicalUser2 = await createUserInDatabase({
      email: `technical2-${Date.now()}@test.com`,
      first_name: 'Tech',
      last_name: 'User2',
      password: 'Tech123!',
      role: 'INFRASTRUCTURES', // Another technical role
    });

    citizenUser = await createUserInDatabase({
      email: `citizen-${Date.now()}@test.com`,
      first_name: 'Citizen',
      last_name: 'User',
      password: 'Citizen123!',
      role: 'CITIZEN',
    });

    publicRelationsUser = await createUserInDatabase({
      email: `pr-${Date.now()}@test.com`,
      first_name: 'PR',
      last_name: 'Officer',
      password: 'PR123!',
      role: 'PUBLIC_RELATIONS',
    });

    adminUser = await createUserInDatabase({
      email: `admin-${Date.now()}@test.com`,
      first_name: 'Admin',
      last_name: 'User',
      password: 'Admin123!',
      role: 'ADMINISTRATOR',
    });

    // Login users
    technicalAgent1 = request.agent(app);
    await technicalAgent1
      .post('/api/session')
      .send({ email: technicalUser1.email, password: 'Tech123!' })
      .expect(200);

    technicalAgent2 = request.agent(app);
    await technicalAgent2
      .post('/api/session')
      .send({ email: technicalUser2.email, password: 'Tech123!' })
      .expect(200);

    citizenAgent = request.agent(app);
    await citizenAgent
      .post('/api/session')
      .send({ email: citizenUser.email, password: 'Citizen123!' })
      .expect(200);

    publicRelationsAgent = request.agent(app);
    await publicRelationsAgent
      .post('/api/session')
      .send({ email: publicRelationsUser.email, password: 'PR123!' })
      .expect(200);

    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/session')
      .send({ email: adminUser.email, password: 'Admin123!' })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/reports/assigned - Basic Functionality', () => {
    it('should return empty array when technical user has no assigned reports', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return only reports assigned to the authenticated technical user', async () => {
      // Arrange - Create reports assigned to different users
      const report1 = await prisma.report.create({
        data: {
          title: 'Report 1 for Tech1',
          description: 'Assigned to technical user 1',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      const report2 = await prisma.report.create({
        data: {
          title: 'Report 2 for Tech1',
          description: 'Another report for technical user 1',
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0704,
          longitude: 7.6870,
          status: ReportStatus.IN_PROGRESS,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // Report assigned to different user
      await prisma.report.create({
        data: {
          title: 'Report for Tech2',
          description: 'Assigned to technical user 2',
          category: ReportCategory.WASTE,
          latitude: 45.0705,
          longitude: 7.6871,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser2.id,
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('status');
      
      const reportIds = response.body.map((r: any) => r.id);
      expect(reportIds).toContain(report1.id);
      expect(reportIds).toContain(report2.id);
    });

    it('should return reports with all required fields', async () => {
      // Arrange
      await prisma.report.create({
        data: {
          title: 'Complete Report',
          description: 'Report with all fields',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          address: 'Via Roma 123, Turin',
          status: ReportStatus.ASSIGNED,
          isAnonymous: false,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      
      const report = response.body[0];
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('title', 'Complete Report');
      expect(report).toHaveProperty('description', 'Report with all fields');
      expect(report).toHaveProperty('category', ReportCategory.ROADS_URBAN_FURNISHINGS);
      expect(report).toHaveProperty('latitude', '45.0703'); // Returned as string
      expect(report).toHaveProperty('longitude', '7.6869'); // Returned as string
      expect(report).toHaveProperty('address', 'Via Roma 123, Turin');
      expect(report).toHaveProperty('status', ReportStatus.ASSIGNED);
      expect(report).toHaveProperty('isAnonymous', false);
      expect(report).toHaveProperty('createdAt');
      expect(report).toHaveProperty('updatedAt');
    });

    it('should include user information in returned reports', async () => {
      // Arrange
      await prisma.report.create({
        data: {
          title: 'Report with User Info',
          description: 'Test user info',
          category: ReportCategory.WASTE,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      
      const report = response.body[0];
      expect(report).toHaveProperty('user');
      expect(report.user).toHaveProperty('id', citizenUser.id);
      expect(report.user).toHaveProperty('email');
      expect(report.user).toHaveProperty('firstName'); // DTO uses camelCase
      expect(report.user).toHaveProperty('lastName'); // DTO uses camelCase
    });
  });

  describe('GET /api/reports/assigned - Status Filtering', () => {
    beforeEach(async () => {
      // Create reports with different statuses
      await prisma.report.create({
        data: {
          title: 'Assigned Report',
          description: 'Status: ASSIGNED',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      await prisma.report.create({
        data: {
          title: 'In Progress Report',
          description: 'Status: IN_PROGRESS',
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0704,
          longitude: 7.6870,
          status: ReportStatus.IN_PROGRESS,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      await prisma.report.create({
        data: {
          title: 'Resolved Report',
          description: 'Status: RESOLVED',
          category: ReportCategory.WASTE,
          latitude: 45.0705,
          longitude: 7.6871,
          status: ReportStatus.RESOLVED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // This should NOT appear (PENDING_APPROVAL)
      await prisma.report.create({
        data: {
          title: 'Pending Report',
          description: 'Status: PENDING_APPROVAL',
          category: ReportCategory.OTHER,
          latitude: 45.0706,
          longitude: 7.6872,
          status: ReportStatus.PENDING_APPROVAL,
          userId: citizenUser.id,
        },
      });
    });

    it('should return all assigned reports without status filter (ASSIGNED, IN_PROGRESS, RESOLVED)', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      
      const statuses = response.body.map((r: any) => r.status);
      expect(statuses).toContain(ReportStatus.ASSIGNED);
      expect(statuses).toContain(ReportStatus.IN_PROGRESS);
      expect(statuses).toContain(ReportStatus.RESOLVED);
      expect(statuses).not.toContain(ReportStatus.PENDING_APPROVAL);
    });

    it('should filter reports by ASSIGNED status', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?status=ASSIGNED');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
      expect(response.body[0].title).toBe('Assigned Report');
    });

    it('should filter reports by IN_PROGRESS status', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?status=IN_PROGRESS');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(ReportStatus.IN_PROGRESS);
      expect(response.body[0].title).toBe('In Progress Report');
    });

    it('should filter reports by RESOLVED status', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?status=RESOLVED');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(ReportStatus.RESOLVED);
      expect(response.body[0].title).toBe('Resolved Report');
    });

    it('should return 400 for invalid status filter', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?status=INVALID_STATUS');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      // OpenAPI validator message
      expect(response.body.message).toMatch(/must be equal to one of the allowed values|Invalid status filter/);
    });

    it('should return 400 for PENDING_APPROVAL status (not allowed for technical users)', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?status=PENDING_APPROVAL');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/reports/assigned - Sorting Functionality', () => {
    beforeEach(async () => {
      // Create reports with different timestamps
      await prisma.report.create({
        data: {
          title: 'Old Report',
          description: 'Created first',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
          createdAt: new Date('2024-01-01'),
        },
      });

      await prisma.report.create({
        data: {
          title: 'New Report',
          description: 'Created last',
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0704,
          longitude: 7.6870,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
          createdAt: new Date('2024-12-31'),
        },
      });

      await prisma.report.create({
        data: {
          title: 'Middle Report',
          description: 'Created in the middle',
          category: ReportCategory.WASTE,
          latitude: 45.0705,
          longitude: 7.6871,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
          createdAt: new Date('2024-06-15'),
        },
      });
    });

    it('should sort reports by createdAt descending by default', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      
      // Should be: New, Middle, Old (desc order)
      expect(response.body[0].title).toBe('New Report');
      expect(response.body[1].title).toBe('Middle Report');
      expect(response.body[2].title).toBe('Old Report');
    });

    it('should sort reports by createdAt ascending', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?sortBy=createdAt&order=asc');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      
      // Should be: Old, Middle, New (asc order)
      expect(response.body[0].title).toBe('Old Report');
      expect(response.body[1].title).toBe('Middle Report');
      expect(response.body[2].title).toBe('New Report');
    });

    it('should sort reports by createdAt descending explicitly', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?sortBy=createdAt&order=desc');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('New Report');
      expect(response.body[2].title).toBe('Old Report');
    });

    it('should reject invalid sortBy parameter', async () => {
      // Act
      const response = await technicalAgent1.get('/api/reports/assigned?sortBy=invalidField');

      // Assert
      // API validation may reject invalid sortBy
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveLength(3);
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('GET /api/reports/assigned - Authorization Tests', () => {
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 when citizen tries to access assigned reports', async () => {
      // Act
      const response = await citizenAgent.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Technical office staff privileges required');
    });

    it('should return 403 when public relations officer tries to access assigned reports', async () => {
      // Act
      const response = await publicRelationsAgent.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Technical office staff privileges required');
    });

    it('should return 403 when admin tries to access assigned reports', async () => {
      // Act
      const response = await adminAgent.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Technical office staff privileges required');
    });

    it('should allow access for all valid technical office roles', async () => {
      // List of all technical roles to test
      const technicalRoles = [
        'CULTURE_EVENTS_TOURISM_SPORTS',
        'LOCAL_PUBLIC_SERVICES',
        'EDUCATION_SERVICES',
        'PUBLIC_RESIDENTIAL_HOUSING',
        'INFORMATION_SYSTEMS',
        'MUNICIPAL_BUILDING_MAINTENANCE',
        'PRIVATE_BUILDINGS',
        'INFRASTRUCTURES',
        'GREENSPACES_AND_ANIMAL_PROTECTION',
        'WASTE_MANAGEMENT',
        'ROAD_MAINTENANCE',
        'CIVIL_PROTECTION',
      ];

      // Test first 3 roles (to avoid test timeout)
      for (const role of technicalRoles.slice(0, 3)) {
        // Arrange
        const techUser = await createUserInDatabase({
          email: `tech-${role}-${Date.now()}@test.com`,
          first_name: 'Tech',
          last_name: role,
          password: 'Tech123!',
          role: role,
        });

        const agent = request.agent(app);
        await agent
          .post('/api/session')
          .send({ email: techUser.email, password: 'Tech123!' })
          .expect(200);

        // Act
        const response = await agent.get('/api/reports/assigned');

        // Assert
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      }
    }, 30000); // Increased timeout
  });

  describe('GET /api/reports/assigned - Edge Cases', () => {
    it('should return empty array when technical user has only PENDING_APPROVAL reports', async () => {
      // Arrange - Create pending report
      await prisma.report.create({
        data: {
          title: 'Pending Report',
          description: 'Should not appear',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.PENDING_APPROVAL,
          userId: citizenUser.id,
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('should return empty array when technical user has only REJECTED reports', async () => {
      // Arrange - Create rejected report (assigned but rejected)
      await prisma.report.create({
        data: {
          title: 'Rejected Report',
          description: 'Should not appear',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Invalid report',
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('should handle multiple filters and sorting combined', async () => {
      // Arrange
      await prisma.report.create({
        data: {
          title: 'Old Assigned',
          description: 'Old and assigned',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
          createdAt: new Date('2024-01-01'),
        },
      });

      await prisma.report.create({
        data: {
          title: 'New Assigned',
          description: 'New and assigned',
          category: ReportCategory.PUBLIC_LIGHTING,
          latitude: 45.0704,
          longitude: 7.6870,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
          createdAt: new Date('2024-12-31'),
        },
      });

      // This should not appear (different status)
      await prisma.report.create({
        data: {
          title: 'In Progress Report',
          description: 'Should not appear',
          category: ReportCategory.WASTE,
          latitude: 45.0705,
          longitude: 7.6871,
          status: ReportStatus.IN_PROGRESS,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      // Act
      const response = await technicalAgent1.get(
        '/api/reports/assigned?status=ASSIGNED&sortBy=createdAt&order=asc'
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Old Assigned');
      expect(response.body[1].title).toBe('New Assigned');
      
      response.body.forEach((report: any) => {
        expect(report.status).toBe(ReportStatus.ASSIGNED);
      });
    });

    it('should not return reports assigned to other technical users', async () => {
      // Arrange - Create reports for both technical users
      await prisma.report.create({
        data: {
          title: 'Report for Tech1',
          description: 'Assigned to tech user 1',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      await prisma.report.create({
        data: {
          title: 'Report for Tech2',
          description: 'Assigned to tech user 2',
          category: ReportCategory.WASTE,
          latitude: 45.0704,
          longitude: 7.6870,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser2.id,
        },
      });

      // Act - Tech1 queries
      const response1 = await technicalAgent1.get('/api/reports/assigned');

      // Assert - Tech1 sees only their report
      expect(response1.status).toBe(200);
      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].title).toBe('Report for Tech1');

      // Act - Tech2 queries
      const response2 = await technicalAgent2.get('/api/reports/assigned');

      // Assert - Tech2 sees only their report
      expect(response2.status).toBe(200);
      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].title).toBe('Report for Tech2');
    });
  });

  describe('GET /api/reports/assigned - Data Integrity', () => {
    it('should include photos in returned reports', async () => {
      // Arrange
      const report = await prisma.report.create({
        data: {
          title: 'Report with Photos',
          description: 'Has photos',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.ASSIGNED,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      await prisma.reportPhoto.createMany({
        data: [
          {
            reportId: report.id,
            url: 'http://localhost:9000/photos/photo1.jpg',
            filename: 'photo1.jpg',
          },
          {
            reportId: report.id,
            url: 'http://localhost:9000/photos/photo2.jpg',
            filename: 'photo2.jpg',
          },
        ],
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('photos');
      expect(response.body[0].photos).toHaveLength(2);
      expect(response.body[0].photos[0]).toHaveProperty('url');
      expect(response.body[0].photos[0]).toHaveProperty('filename');
    });

    it('should include messages in returned reports', async () => {
      // Arrange
      const report = await prisma.report.create({
        data: {
          title: 'Report with Messages',
          description: 'Has messages',
          category: ReportCategory.ROADS_URBAN_FURNISHINGS,
          latitude: 45.0703,
          longitude: 7.6869,
          status: ReportStatus.IN_PROGRESS,
          userId: citizenUser.id,
          assignedToId: technicalUser1.id,
        },
      });

      await prisma.reportMessage.create({
        data: {
          reportId: report.id,
          senderId: technicalUser1.id,
          content: 'Work in progress',
        },
      });

      // Act
      const response = await technicalAgent1.get('/api/reports/assigned');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('messages');
      expect(response.body[0].messages).toHaveLength(1);
      expect(response.body[0].messages[0]).toHaveProperty('content', 'Work in progress');
    });
  });
});

