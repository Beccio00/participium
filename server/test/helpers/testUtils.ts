import { hashPassword } from '../../src/services/passwordService';
import { AppDataSource } from '../../src/utils/AppDataSource';
import { User } from '../../src/entities/User';

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

  const userRepository = AppDataSource.getRepository(User);
  const user = userRepository.create({
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    password: hashedPassword,
    salt: salt,
    role: data.role as any,
  });

  return await userRepository.save(user);
}

/**
 * Verify password is correctly hashed before storage
 */
export async function verifyPasswordIsHashed(email: string, plainPassword: string) {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
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

