/**
 * Integration Tests for Story 5 (PT05)
 * User Story: As a citizen, I want to provide details for my report
 *             So that the problem is classified correctly.
 * 
 * Mandatory fields: title, description, category, photos (min 1 max 3)
 */

import request from 'supertest';
import { createApp } from '../../../src/app';
import { cleanDatabase, disconnectDatabase } from '../../helpers/testSetup';
import { createUserInDatabase } from '../../helpers/testUtils';
import { ReportCategory } from '../../../../shared/ReportTypes';
import fs from 'fs';
import path from 'path';

const app = createApp();

describe('Story 5 - Report Details Integration Tests', () => {
  let citizenAgent: any;
  let citizenEmail: string;

  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();

    // Create and login a citizen for each test
    citizenEmail = `citizen-${Date.now()}@test.com`;
    await createUserInDatabase({
      email: citizenEmail,
      password: 'Citizen123!',
      role: 'CITIZEN',
    });

    citizenAgent = request.agent(app);
    await citizenAgent
      .post('/api/session')
      .send({ email: citizenEmail, password: 'Citizen123!' })
      .expect(200);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Photo Validation - Minimum Requirements', () => {
    it('should successfully create report with exactly 1 photo (minimum)', async () => {
      // Arrange
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');
      
      // Create a test image buffer if file doesn't exist
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with 1 photo')
        .field('description', 'Testing minimum photo requirement')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Report created successfully');
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('number');
    });

    it('should return 400 when no photos are provided (minimum violation)', async () => {
      // Arrange & Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report without photos')
        .field('description', 'This should fail')
        .field('category', ReportCategory.ROADS_URBAN_FURNISHINGS)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false');
        // No photos attached

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('photo');
    });

    it('should return 400 when photos array is empty', async () => {
      // Arrange & Act
      const response = await citizenAgent
        .post('/api/reports')
        .send({
          title: 'Report with empty photos array',
          description: 'This should fail',
          category: ReportCategory.WASTE,
          latitude: 45.0703,
          longitude: 7.6869,
          isAnonymous: false,
          photos: [], // Empty array
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Photo Validation - Maximum Requirements', () => {
    it('should successfully create report with exactly 3 photos (maximum)', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with 3 photos')
        .field('description', 'Testing maximum photo requirement')
        .field('category', ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg')
        .attach('photos', imageBuffer, 'photo2.jpg')
        .attach('photos', imageBuffer, 'photo3.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Report created successfully');
      expect(response.body).toHaveProperty('id');
    }, 10000); // Increased timeout for multiple photo uploads

    it('should return 400 when more than 3 photos are provided (maximum violation)', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with 4 photos')
        .field('description', 'This should fail - too many photos')
        .field('category', ReportCategory.WATER_SUPPLY_DRINKING_WATER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg')
        .attach('photos', imageBuffer, 'photo2.jpg')
        .attach('photos', imageBuffer, 'photo3.jpg')
        .attach('photos', imageBuffer, 'photo4.jpg'); // 4th photo - should fail

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      // Note: Multer returns "Unexpected field" when too many files are uploaded
      expect(response.body.message).toMatch(/Maximum 3 photos|Unexpected field/);
    });

    it('should successfully create report with 2 photos (within range)', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with 2 photos')
        .field('description', 'Testing valid photo count')
        .field('category', ReportCategory.SEWER_SYSTEM)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg')
        .attach('photos', imageBuffer, 'photo2.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Category Validation', () => {
    it('should reject report with invalid category', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with invalid category')
        .field('description', 'Testing invalid category')
        .field('category', 'INVALID_CATEGORY') // Invalid category
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Invalid category');
    });

    it('should accept all valid report categories', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');
      const validCategories: ReportCategory[] = [
        ReportCategory.WATER_SUPPLY_DRINKING_WATER,
        ReportCategory.ARCHITECTURAL_BARRIERS,
        ReportCategory.SEWER_SYSTEM,
        ReportCategory.PUBLIC_LIGHTING,
        ReportCategory.WASTE,
        ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
        ReportCategory.ROADS_URBAN_FURNISHINGS,
        ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS,
        ReportCategory.OTHER,
      ];

      // Act & Assert
      for (const category of validCategories) {
        const response = await citizenAgent
          .post('/api/reports')
          .field('title', `Report for ${category}`)
          .field('description', `Testing category: ${category}`)
          .field('category', category)
          .field('latitude', '45.0703')
          .field('longitude', '7.6869')
          .field('isAnonymous', 'false')
          .attach('photos', imageBuffer, `photo-${category}.jpg`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      }
    }, 30000); // Increased timeout for testing all 9 categories

    it('should reject report when category is empty string', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with empty category')
        .field('description', 'Testing empty category')
        .field('category', '') // Empty string
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Title and Description Validation', () => {
    it('should accept report with minimum valid title length', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'A') // Single character title
        .field('description', 'Valid description')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should accept report with minimum valid description length', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Valid Title')
        .field('description', 'X') // Single character description
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should accept report with long title', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');
      const longTitle = 'A'.repeat(200); // 200 characters

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', longTitle)
        .field('description', 'Valid description')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should accept report with long description', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');
      const longDescription = 'This is a very detailed description. '.repeat(50); // ~1750 characters

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Valid Title')
        .field('description', longDescription)
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should accept report with special characters in title and description', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report with symbols: !@#$%^&*()')
        .field('description', 'Description with unicode: 你好 مرحبا Привет')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject report with empty title', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', '') // Empty title
        .field('description', 'Valid description')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject report with empty description', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Valid Title')
        .field('description', '') // Empty description
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Coordinates Validation', () => {
    it('should reject report with coordinates outside Turin boundaries', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act - Use coordinates clearly outside Turin (Rome coordinates)
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report outside Turin')
        .field('description', 'Testing boundary validation')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '41.9028') // Rome latitude - outside Turin
        .field('longitude', '12.4964') // Rome longitude - outside Turin
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.message).toContain('Turin');
    });

    it('should accept report with coordinates within Turin boundaries', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act - Valid Turin coordinates (Piazza Castello)
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Report in Turin')
        .field('description', 'Valid Turin location')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703') // Turin center
        .field('longitude', '7.6869') // Turin center
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject report with invalid latitude (> 90) - general validation', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid latitude test')
        .field('description', 'Testing boundary')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '91') // Invalid: > 90
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert - Expect 400 or 422 depending on which validation catches it first
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject report with invalid latitude (< -90) - general validation', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid latitude test')
        .field('description', 'Testing boundary')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '-91') // Invalid: < -90
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject report with invalid longitude (> 180) - general validation', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid longitude test')
        .field('description', 'Testing boundary')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '181') // Invalid: > 180
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject report with invalid longitude (< -180) - general validation', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid longitude test')
        .field('description', 'Testing boundary')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', '-181') // Invalid: < -180
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject report with non-numeric latitude', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid latitude type')
        .field('description', 'Testing non-numeric')
        .field('category', ReportCategory.OTHER)
        .field('latitude', 'not-a-number')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('coordinates');
    });

    it('should reject report with non-numeric longitude', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Invalid longitude type')
        .field('description', 'Testing non-numeric')
        .field('category', ReportCategory.OTHER)
        .field('latitude', '45.0703')
        .field('longitude', 'not-a-number')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('coordinates');
    });
  });

  describe('Complete Report Submission - All Fields', () => {
    it('should successfully create a complete report with all mandatory fields', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const response = await citizenAgent
        .post('/api/reports')
        .field('title', 'Broken Street Light on Via Roma')
        .field('description', 'The street light has been out for 3 days, making the area dangerous at night')
        .field('category', ReportCategory.PUBLIC_LIGHTING)
        .field('latitude', '45.0703')
        .field('longitude', '7.6869')
        .field('isAnonymous', 'false')
        .attach('photos', imageBuffer, 'photo1.jpg')
        .attach('photos', imageBuffer, 'photo2.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Report created successfully');
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('number');
      expect(response.body.id).toBeGreaterThan(0);
    });

    it('should classify report correctly based on category', async () => {
      // Arrange
      const imageBuffer = Buffer.from('fake-image-data');
      const categoriesWithDescriptions = [
        { category: ReportCategory.WATER_SUPPLY_DRINKING_WATER, description: 'Water leakage issue' },
        { category: ReportCategory.ARCHITECTURAL_BARRIERS, description: 'Broken wheelchair ramp' },
        { category: ReportCategory.SEWER_SYSTEM, description: 'Blocked drain' },
        { category: ReportCategory.WASTE, description: 'Overflowing trash bin' },
        { category: ReportCategory.ROADS_URBAN_FURNISHINGS, description: 'Damaged sidewalk' },
      ];

      // Act & Assert
      for (const item of categoriesWithDescriptions) {
        const response = await citizenAgent
          .post('/api/reports')
          .field('title', `Issue: ${item.category}`)
          .field('description', item.description)
          .field('category', item.category)
          .field('latitude', '45.0703')
          .field('longitude', '7.6869')
          .field('isAnonymous', 'false')
          .attach('photos', imageBuffer, `photo-${item.category}.jpg`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      }
    }, 15000); // Increased timeout for testing multiple categories
  });
});

