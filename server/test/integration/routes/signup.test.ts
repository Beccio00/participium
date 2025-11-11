import request from 'supertest';
import { createApp } from '../../../src/app';
import { cleanDatabase, disconnectDatabase } from '../../helpers/testSetup';
import { createTestUserData, createUserInDatabase, verifyPasswordIsHashed } from '../../helpers/testUtils';

const app = createApp();

describe('POST /api/citizen/signup', () => {
  // Clean database before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Disconnect database after all tests
  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Success scenarios', () => {
    it('should successfully register a new citizen with valid data', async () => {
      // Arrange
      const userData = createTestUserData({
        email: `test-${Date.now()}@example.com` // Use unique email to avoid conflicts
      });

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData);

      // Assert - Check status code
      if (response.status !== 201) {
        console.error('Registration failed:', response.body);
      }
      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/json/);
      
      expect(response.body).toHaveProperty('firstName', userData.firstName);
      expect(response.body).toHaveProperty('lastName', userData.lastName);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('role', 'CITIZEN');
      expect(response.body).toHaveProperty('telegramUsername', null);
      expect(response.body).toHaveProperty('emailNotificationsEnabled', true);
      
      // Ensure password and salt are not returned
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('salt');
    });

    it('should encrypt password before storing in database', async () => {
      // Arrange - Use unique email to avoid conflicts
      const userData = createTestUserData({
        email: `encrypt-test-${Date.now()}@example.com`
      });

      // Act
      await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(201);

      // Assert - Verify password is encrypted before storage
      const isHashed = await verifyPasswordIsHashed(userData.email, userData.password);
      expect(isHashed).toBe(true);
    });
  });

  describe('Validation - Missing required fields', () => {
    it('should return 400 when firstName is missing', async () => {
      // Arrange
      const userData = createTestUserData();
      delete (userData as any).firstName;

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('firstName');
    });

    it('should return 400 when lastName is missing', async () => {
      // Arrange
      const userData = createTestUserData();
      delete (userData as any).lastName;

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('lastName');
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      const userData = createTestUserData();
      delete (userData as any).email;

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('email');
    });

    it('should return 400 when password is missing', async () => {
      // Arrange
      const userData = createTestUserData();
      delete (userData as any).password;

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('password');
    });

    it('should return 400 when multiple fields are missing', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        // lastName, email, password missing
      };

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('lastName');
      expect(response.body.message).toContain('email');
      expect(response.body.message).toContain('password');
    });
  });

  describe('Validation - Email conflict', () => {
    it('should return 409 when email already exists', async () => {
      // Arrange - Create a user first
      const existingEmail = 'existing@test.com';
      await createUserInDatabase({ email: existingEmail });

      const newUserData = createTestUserData({ email: existingEmail });

      // Act - Try to register with the same email
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(newUserData)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('error', 'Conflict');
      expect(response.body.message).toContain('Email already in use');
    });

    it('should allow registration with different email', async () => {
      // Arrange
      await createUserInDatabase({ email: 'existing@test.com' });
      const newUserData = createTestUserData({ email: 'new@test.com' });

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(newUserData)
        .expect(201);

      // Assert
      expect(response.body.email).toBe('new@test.com');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string fields as missing', async () => {
      // Arrange
      const userData = {
        firstName: '',
        lastName: 'Doe',
        email: 'test@test.com',
        password: 'Test1234!',
      };

      // Act
      const response = await request(app)
        .post('/api/citizen/signup')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error', 'BadRequest');
      expect(response.body.message).toContain('firstName');
    });
  });
});

