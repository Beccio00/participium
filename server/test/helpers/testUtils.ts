import { hashPassword } from '../../src/services/passwordService';
import { User } from '../../src/entities/User';
import { Report } from '../../src/entities/Report';
import { UserDTO, MunicipalityUserDTO } from '../../src/interfaces/UserDTO';
import { Role } from '../../../shared/RoleTypes';
import { ReportCategory, ReportStatus } from '../../../shared/ReportTypes';
import { AppDataSource } from '../../src/utils/AppDataSource';

/**
 * 创建一个完整的 mock User 对象（包含所有 TypeORM 关联字段）
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "test@test.com",
    first_name: "Test",
    last_name: "User",
    password: "hashedPassword",
    salt: "salt",
    role: Role.CITIZEN,
    telegram_username: null,
    email_notifications_enabled: true,
    externalCompanyId: null,
    externalCompany: null,
    // TypeORM 关联字段
    reports: [],
    messages: [],
    assignedReports: [],
    notifications: [],
    photo: null as any,
    internalNotes: [],
    ...overrides,
  } as User;
}

/**
 * 创建一个 mock UserDTO 对象
 */
export function createMockUserDTO(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 1,
    email: "test@test.com",
    firstName: "Test",
    lastName: "User",
    role: Role.CITIZEN,
    telegramUsername: null,
    emailNotificationsEnabled: true,
    ...overrides,
  };
}

/**
 * 创建一个 mock MunicipalityUserDTO 对象
 */
export function createMockMunicipalityUserDTO(overrides: Partial<MunicipalityUserDTO> = {}): MunicipalityUserDTO {
  return {
    id: 1,
    email: "municipality@test.com",
    firstName: "Municipality",
    lastName: "User",
    role: Role.PUBLIC_RELATIONS,
    ...overrides,
  };
}

/**
 * 创建一个 mock Report 对象
 */
export function createMockReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 1,
    title: "Test Report",
    description: "Test Description",
    category: ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
    status: ReportStatus.PENDING_APPROVAL,
    latitude: 45.0703,
    longitude: 7.6869,
    address: "Via Roma 1",
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
    user: null as any,
    assignedOfficerId: null,
    externalMaintainerId: null,
    externalCompanyId: null,
    rejectedReason: null,
    photos: [],
    messages: [],
    notifications: [],
    ...overrides,
  } as Report;
}

/**
 * Create test user data (for signup tests)
 */
export function createTestUserData(overrides: Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role | string;
  first_name: string;
  last_name: string;
}> = {}) {
  return {
    email: overrides.email || `test-${Date.now()}@test.com`,
    password: overrides.password || 'TestPassword123!',
    firstName: overrides.firstName || overrides.first_name || 'Test',
    lastName: overrides.lastName || overrides.last_name || 'User',
    role: overrides.role || Role.CITIZEN,
    ...overrides,
  };
}

/**
 * Create a user directly in the database for testing
 */
export async function createUserInDatabase(userData: Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role | string;
  first_name: string;
  last_name: string;
}> = {}): Promise<User> {
  const defaultData = {
    email: `test-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    role: Role.CITIZEN,
  };

  const data = { ...defaultData, ...userData };
  
  // Handle firstName/lastName vs first_name/last_name
  const firstName = (userData as any).firstName || data.first_name;
  const lastName = (userData as any).lastName || data.last_name;
  
  const { hashedPassword, salt } = await hashPassword(data.password);

  const userRepository = AppDataSource.getRepository(User);
  const user = userRepository.create({
    email: data.email,
    first_name: firstName,
    last_name: lastName,
    password: hashedPassword,
    salt: salt,
    role: data.role as any,
  });

  return await userRepository.save(user);
}

/**
 * Verify that a user's password is properly hashed
 */
export async function verifyPasswordIsHashed(email: string, plainPassword: string) {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
  if (!user) return false;
  
  // Password should be a hash, not equal to plain password
  return user.password !== plainPassword && user.password.length > 50;
}

// 重新导出 Role 枚举，方便测试文件使用
export { Role };
