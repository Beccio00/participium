/**
 * E2E Test for Story 27 - Citizen Email Verification Author: Luan
 * npm test -- citizenEmailVerification.e2e.test.ts
 * 
 * Story 27 (PT27): As a citizen, I want to confirm my registration with a verification code
 * so that my account becomes valid and I can start using the system.
 * 
 * The user gets an email with a confirmation code valid for 30 minutes after registration.
 */

// Mock email service before any imports
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, TestDataSource } from '../helpers/testSetup';
import { User } from '../../src/entities/User';

const app = createApp();

describe('Citizen Email Verification E2E (Story 27)', () => {
  const password = 'Test1234!';

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Complete registration and verification workflow', () => {
    it('should complete full workflow: Register → Receive code → Verify → Login', async () => {
      const email = `newcitizen${Date.now()}@example.com`;

      // Step 1: Citizen registers
      const signupResponse = await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'New',
          lastName: 'Citizen',
          email: email,
          password: password,
        });

      // Debug: print error if 500
      if (signupResponse.status === 500) {
        console.error('Signup failed with 500:', signupResponse.body);
      }

      expect(signupResponse.status).toBe(201);
      expect(signupResponse.body).toHaveProperty('id');
      expect(signupResponse.body).toHaveProperty('email', email);
      expect(signupResponse.body).toHaveProperty('isVerified', false);

      // Step 2: Verify user is created but not verified
      const userRepo = TestDataSource.getRepository(User);
      const userBeforeVerification = await userRepo.findOne({ where: { email } });
      expect(userBeforeVerification).toBeTruthy();
      expect(userBeforeVerification!.isVerified).toBe(false);
      expect(userBeforeVerification!.verificationToken).toBeTruthy();
      expect(userBeforeVerification!.verificationCodeExpiresAt).toBeTruthy();

      // Step 3: Get verification code from database (simulating email)
      const verificationCode = userBeforeVerification!.verificationToken!;

      // Step 4: Verify email with code
      const verifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({
          email: email,
          code: verificationCode,
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('message');
      expect(verifyResponse.body.message).toContain('verified');

      // Step 5: Verify user is now verified
      const userAfterVerification = await userRepo.findOne({ where: { email } });
      expect(userAfterVerification!.isVerified).toBe(true);
      expect(userAfterVerification!.verificationToken).toBeNull();

      // Step 6: Login successfully after verification
      const loginAgent = request.agent(app);
      const loginResponse = await loginAgent
        .post('/api/session')
        .send({ email, password })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email).toBe(email);

      // Step 7: Create a report after verification
      const reportResponse = await loginAgent
        .post('/api/reports')
        .field('title', 'Test report after verification')
        .field('description', 'This should work now')
        .field('category', 'PUBLIC_LIGHTING')
        .field('latitude', '45.0704')
        .field('longitude', '7.6870')
        .field('isAnonymous', 'false')
        .attach('photos', Buffer.from('fake-image'), 'test.jpg')
        .expect(201);

      expect(reportResponse.body.report).toHaveProperty('id');
    });

    it('should handle expired verification code (30 minutes)', async () => {
      const email = `expired${Date.now()}@example.com`;

      // Step 1: Register
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Expired',
          lastName: 'User',
          email: email,
          password: password,
        })
        .expect(201);

      // Step 2: Manually expire the verification code
      const userRepo = TestDataSource.getRepository(User);
      const expiredDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      await userRepo.update(
        { email },
        { verificationCodeExpiresAt: expiredDate }
      );

      // Step 3: Get the code
      const user = await userRepo.findOne({ where: { email } });
      const expiredCode = user!.verificationToken!;

      // Step 4: Try to verify with expired code
      const verifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({
          email: email,
          code: expiredCode,
        });

      // Assert - Should reject expired code
      expect(verifyResponse.status).toBe(400);
      expect(verifyResponse.body.message).toContain('expired');

      // Verify user is still not verified
      const userRepo2 = TestDataSource.getRepository(User);
      const userAfter = await userRepo2.findOne({ where: { email } });
      expect(userAfter!.isVerified).toBe(false);
    });

    it('should allow resending verification code', async () => {
      const email = `resend${Date.now()}@example.com`;

      // Step 1: Register
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Resend',
          lastName: 'User',
          email: email,
          password: password,
        })
        .expect(201);

      // Step 2: Get original verification code
      const userBefore = await TestDataSource.getRepository(User).findOne({ where: { email } });
      const originalCode = userBefore!.verificationToken;

      // Step 3: Request new verification code
      const resendResponse = await request(app)
        .post('/api/citizen/resend-verification')
        .send({ email })
        .expect(200);

      expect(resendResponse.body.message).toContain('sent');

      // Step 4: Verify new code is different from original
      const userAfterResend = await TestDataSource.getRepository(User).findOne({ where: { email } });
      const newCode = userAfterResend!.verificationToken;
      expect(newCode).not.toBe(originalCode);

      // Step 5: Old code should not work
      const verifyWithOldCode = await request(app)
        .post('/api/citizen/verify')
        .send({ email, code: originalCode });
      expect(verifyWithOldCode.status).toBe(400);

      // Step 6: New code should work
      const verifyWithNewCode = await request(app)
        .post('/api/citizen/verify')
        .send({ email, code: newCode! })
        .expect(200);

      expect(verifyWithNewCode.body.message).toContain('verified');

      // Verify user is now verified
      const finalUser = await TestDataSource.getRepository(User).findOne({ where: { email } });
      expect(finalUser!.isVerified).toBe(true);
    });

    it('should handle invalid verification code', async () => {
      const email = `invalid${Date.now()}@example.com`;

      // Step 1: Register
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Invalid',
          lastName: 'Code',
          email: email,
          password: password,
        })
        .expect(201);

      // Step 2: Try to verify with wrong code
      const verifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({
          email: email,
          code: '000000', // Wrong code
        });

      // Assert - Should reject
      expect(verifyResponse.status).toBe(400);
      expect(verifyResponse.body.message).toContain('Invalid');

      // Verify user is still not verified
      const user = await TestDataSource.getRepository(User).findOne({ where: { email } });
      expect(user!.isVerified).toBe(false);
    });

    it('should handle verification of non-existent email', async () => {
      // Act - Try to verify non-existent email
      const verifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({
          email: 'nonexistent@example.com',
          code: '123456',
        });

      // Assert - Should return error
      expect(verifyResponse.status).toBe(404);
      expect(verifyResponse.body.error).toBe('NotFound');
    });

    it('should handle multiple verification attempts with rate limiting behavior', async () => {
      const email = `multiple${Date.now()}@example.com`;

      // Step 1: Register
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Multiple',
          lastName: 'Attempts',
          email: email,
          password: password,
        })
        .expect(201);

      // Step 2: Get correct code
      const user = await TestDataSource.getRepository(User).findOne({ where: { email } });
      const correctCode = user!.verificationToken!;

      // Step 3: Try wrong codes multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/citizen/verify')
          .send({ email, code: '000000' })
          .expect(400);
      }

      // Step 4: Correct code should still work
      const verifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({ email, code: correctCode })
        .expect(200);

      expect(verifyResponse.body.message).toContain('verified');
    });

    it('should prevent double verification', async () => {
      const email = `double${Date.now()}@example.com`;

      // Step 1: Register and verify
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Double',
          lastName: 'Verify',
          email: email,
          password: password,
        })
        .expect(201);

      const user = await TestDataSource.getRepository(User).findOne({ where: { email } });
      const code = user!.verificationToken!;

      await request(app)
        .post('/api/citizen/verify')
        .send({ email, code })
        .expect(200);

      // Step 2: Try to verify again
      const secondVerifyResponse = await request(app)
        .post('/api/citizen/verify')
        .send({ email, code });

      // Assert - Should handle already verified account (API returns 200 with "already verified" message)
      expect(secondVerifyResponse.status).toBe(200);
      expect(secondVerifyResponse.body.message).toContain('already verified');
    });
  });

  describe('Resend verification code scenarios', () => {
    it('should handle resend for unverified user', async () => {
      const email = `resendvalid${Date.now()}@example.com`;

      // Register
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Valid',
          lastName: 'Resend',
          email: email,
          password: password,
        })
        .expect(201);

      // Resend verification
      const resendResponse = await request(app)
        .post('/api/citizen/resend-verification')
        .send({ email })
        .expect(200);

      expect(resendResponse.body.message).toContain('sent');
    });

    it('should reject resend for already verified user', async () => {
      const email = `alreadyverified${Date.now()}@example.com`;

      // Register and verify
      await request(app)
        .post('/api/citizen/signup')
        .send({
          firstName: 'Already',
          lastName: 'Verified',
          email: email,
          password: password,
        })
        .expect(201);

      const user = await TestDataSource.getRepository(User).findOne({ where: { email } });
      await request(app)
        .post('/api/citizen/verify')
        .send({ email, code: user!.verificationToken! })
        .expect(200);

      // Try to resend
      const resendResponse = await request(app)
        .post('/api/citizen/resend-verification')
        .send({ email });

      expect(resendResponse.status).toBe(400);
      expect(resendResponse.body.message).toContain('already verified');
    });

    it('should reject resend for non-existent user', async () => {
      const resendResponse = await request(app)
        .post('/api/citizen/resend-verification')
        .send({ email: 'nonexistent@example.com' });

      expect(resendResponse.status).toBe(404);
      expect(resendResponse.body.error).toBe('NotFound');
    });
  });
});

