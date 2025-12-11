import { User } from "../../src/entities/User";
import { Report } from "../../src/entities/Report";
import { UserDTO, MunicipalityUserDTO } from "../../src/interfaces/UserDTO";
import { Role } from "../../../shared/RoleTypes";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { AppDataSource } from "./testSetup";
import { hashPassword } from "../../src/services/passwordService";

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
    isVerified: true,
    verificationToken: null,
    verificationCodeExpiresAt: null,
    externalCompanyId: null,
    externalCompany: null,
    // TypeORM 关联字段
    reports: [],
    messages: [],
    assignedReports: [],
    notifications: [],
    internalNotes: [],
    photo: null as any,
    ...overrides,
  };
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
    isVerified: true,
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
 * 在数据库中创建一个真实的用户（用于 E2E 测试）
 */
export async function createUserInDatabase(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: Role | string;
  isVerified?: boolean;
  externalCompanyId?: number | null;
}): Promise<User> {
  const password = data.password || 'Test1234!';
  const { hashedPassword, salt } = await hashPassword(password);
  
  const userRepo = AppDataSource.getRepository(User);
  const user = userRepo.create({
    email: data.email,
    first_name: data.firstName || 'Test',
    last_name: data.lastName || 'User',
    password: hashedPassword,
    salt: salt,
    role: (data.role as Role) || Role.CITIZEN,
    isVerified: data.isVerified ?? true, // Default to verified for E2E tests
    telegram_username: null,
    email_notifications_enabled: true,
    externalCompanyId: data.externalCompanyId ?? null,
  });

  return await userRepo.save(user);
}

// Legacy helper functions for backward compatibility
export function createTestUserData(overrides: any = {}) {
  // Remove role from overrides as it's not accepted in signup API
  const { role, ...restOverrides } = overrides;
  
  // Build the data object with defaults, using restOverrides (without role)
  return {
    firstName: restOverrides.firstName || 'Test',
    lastName: restOverrides.lastName || 'User',
    email: restOverrides.email || 'test@example.com',
    password: restOverrides.password || 'Test1234!',
  };
}

export async function verifyPasswordIsHashed(email: string, plainPassword: string): Promise<boolean> {
  // Fetch user from database
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });
  
  if (!user) {
    return false;
  }
  
  // Check if stored password is hashed (starts with $2b$ or $2a$ for bcrypt)
  const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
  
  // Also verify the password is not stored in plain text
  const isNotPlainText = user.password !== plainPassword;
  
  return isHashed && isNotPlainText;
}

// 重新导出 Role 枚举，方便测试文件使用
export { Role };
