import { hashPassword } from '../../src/services/passwordService';
import { prisma } from './testSetup';

/**
 * Create test user data
 */
export function createTestUserData(overrides?: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}>) {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    password: 'Test1234!',
    ...overrides,
  };
}

/**
 * Create user directly in database (for test setup)
 */
export async function createUserInDatabase(userData?: Partial<{
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
}>) {
  const defaultData = {
    email: 'existing@test.com',
    first_name: 'Existing',
    last_name: 'User',
    password: 'Test1234!',
    role: 'CITIZEN',
  };

  const data = { ...defaultData, ...userData };
  const { hashedPassword, salt } = await hashPassword(data.password);

  return await prisma.user.create({
    data: {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: hashedPassword,
      salt: salt,
      role: data.role as any,
    },
  });
}

/**
 * Delete user from database (for test cleanup/setup)
 */
export async function deleteUserFromDatabase(userId: number) {
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify password is correctly hashed before storage
 */
export async function verifyPasswordIsHashed(email: string, plainPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return false;
  
  // Password should be a hash, not equal to plain password
  return user.password !== plainPassword && user.password.length > 50;
}

/**
 * Wait for specified time (for async operations)
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

