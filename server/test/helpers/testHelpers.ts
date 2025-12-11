/**
 * Common test helpers to reduce code duplication across test files
 */

import request from 'supertest';
import type { Express } from 'express';

/**
 * Creates a logged-in agent for testing authenticated endpoints
 */
export async function createAuthenticatedAgent(
  app: Express,
  email: string,
  password: string
) {
  const agent = request.agent(app);
  await agent.post('/api/session').send({ email, password }).expect(200);
  return agent;
}

/**
 * Common signup data factory
 */
export function createSignupData(overrides: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}> = {}) {
  return {
    firstName: overrides.firstName !== undefined ? overrides.firstName : 'Test',
    lastName: overrides.lastName !== undefined ? overrides.lastName : 'User',
    email: overrides.email !== undefined ? overrides.email : `test-${Date.now()}@example.com`,
    password: overrides.password !== undefined ? overrides.password : 'SecurePass123!',
  };
}

/**
 * Common report data factory
 */
export function createReportData(overrides: Partial<{
  title: string;
  description: string;
  category: string;
  latitude: string;
  longitude: string;
  isAnonymous: string;
}> = {}) {
  return {
    title: overrides.title || 'Test Report',
    description: overrides.description || 'Test Description',
    category: overrides.category || 'PUBLIC_LIGHTING',
    latitude: overrides.latitude || '45.0703',
    longitude: overrides.longitude || '7.6869',
    isAnonymous: overrides.isAnonymous || 'false',
  };
}

/**
 * Common assertion helpers
 */
export const assertUserDTO = (body: any, expectedData: { firstName?: string; lastName?: string; email?: string; role?: string }) => {
  if (expectedData.firstName) {
    expect(body).toHaveProperty('firstName', expectedData.firstName);
  }
  if (expectedData.lastName) {
    expect(body).toHaveProperty('lastName', expectedData.lastName);
  }
  if (expectedData.email) {
    expect(body).toHaveProperty('email', expectedData.email);
  }
  if (expectedData.role) {
    expect(body).toHaveProperty('role', expectedData.role);
  }
  // Common fields
  expect(body).toHaveProperty('id');
  expect(body).not.toHaveProperty('password');
  expect(body).not.toHaveProperty('salt');
};

/**
 * Common error assertion helper
 */
export const assertErrorResponse = (body: any, expectedError: string, messageContains?: string) => {
  expect(body).toHaveProperty('error', expectedError);
  if (messageContains) {
    expect(body.message).toContain(messageContains);
  }
};

/**
 * Uploads a test photo using multipart/form-data
 */
export function attachTestPhoto(request: request.Test, fieldName: string = 'photos', filename: string = 'test.jpg') {
  return request.attach(fieldName, Buffer.from('fake-image-data'), filename);
}

/**
 * Creates a report via multipart form submission
 * Automatically attaches required fields and photos
 */
export function createReportViaForm(
  agent: any,
  reportData: {
    title?: string;
    description?: string;
    category?: string;
    latitude?: string;
    longitude?: string;
    isAnonymous?: string;
    photoCount?: number;
  } = {}
) {
  const req = agent
    .post('/api/reports')
    .field('title', reportData.title || 'Test Report')
    .field('description', reportData.description || 'Test Description')
    .field('category', reportData.category || 'PUBLIC_LIGHTING')
    .field('latitude', reportData.latitude || '45.0703')
    .field('longitude', reportData.longitude || '7.6869')
    .field('isAnonymous', reportData.isAnonymous || 'false');

  // Attach photos (default 1)
  const photoCount = reportData.photoCount || 1;
  for (let i = 0; i < photoCount; i++) {
    req.attach('photos', Buffer.from('fake-image'), `photo${i + 1}.jpg`);
  }

  return req;
}

/**
 * Creates a logged-in citizen agent for report testing
 */
export async function createCitizenAgent(app: Express, emailPrefix?: string) {
  const email = emailPrefix
    ? `${emailPrefix}-${Date.now()}@example.com`
    : `citizen-${Date.now()}@example.com`;
  // NOSONAR - Hard-coded password is acceptable in test helpers
  // This is test data only and does not represent a security risk
  const password = 'Citizen123!';

  // Import here to avoid circular dependency
  const { createUserInDatabase } = require('./testUtils');

  await createUserInDatabase({
    email,
    password,
    role: 'CITIZEN',
  });

  const agent = await createAuthenticatedAgent(app, email, password);
  return { agent, email, password };
}

/**
 * Creates mock request for middleware testing
 */
export function createMockRequest(body: any = {}, params: any = {}, query: any = {}): any {
  return {
    body,
    params,
    query,
    user: undefined,
  };
}

/**
 * Creates mock response for middleware testing
 */
export function createMockResponse(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Creates mock next function for middleware testing
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Helper to test middleware with coordinates
 */
export function testCoordinates(
  middleware: (req: any, res: any, next: any) => void,
  latitude: string,
  longitude: string,
  shouldPass: boolean = true
): { req: any; res: any; next: jest.Mock } {
  const req = createMockRequest({ latitude, longitude });
  const res = createMockResponse();
  const next = createMockNext();

  if (shouldPass) {
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  } else {
    // For shouldPass = false, just call the middleware and let it throw
    // The test should wrap this call in expect(() => ...).toThrow()
    middleware(req, res, next);
  }

  return { req, res, next };
}

/**
 * Assert report creation response structure
 */
export function assertReportCreated(response: any, expectedData?: {
  title?: string;
  category?: string;
  status?: string;
}) {
  expect(response.body).toHaveProperty('message', 'Report created successfully');
  expect(response.body.report).toHaveProperty('id');
  expect(typeof response.body.report.id).toBe('number');

  if (expectedData) {
    if (expectedData.title) {
      expect(response.body.report).toHaveProperty('title', expectedData.title);
    }
    if (expectedData.category) {
      expect(response.body.report).toHaveProperty('category', expectedData.category);
    }
    if (expectedData.status) {
      expect(response.body.report).toHaveProperty('status', expectedData.status);
    }
  }
}

