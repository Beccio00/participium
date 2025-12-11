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
  firstName: string;
  lastName: string;
  password: string;
  role: Role | string;
  isVerified?: boolean;
  externalCompanyId?: number | null;
}): Promise<User> {
  const { hashedPassword, salt } = await hashPassword(data.password);
  
  const userRepo = AppDataSource.getRepository(User);
  const user = userRepo.create({
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    password: hashedPassword,
    salt: salt,
    role: data.role as Role,
    isVerified: data.isVerified ?? true, // Default to verified for E2E tests
    telegram_username: null,
    email_notifications_enabled: true,
    externalCompanyId: data.externalCompanyId ?? null,
  });
  
  return await userRepo.save(user);
}

// 重新导出 Role 枚举，方便测试文件使用
export { Role };
