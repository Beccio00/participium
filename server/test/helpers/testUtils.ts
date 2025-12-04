import { Role, User } from "../../src/entities/User";
import { Report, ReportStatus, ReportCategory } from "../../src/entities/Report";
import { UserDTO, MunicipalityUserDTO } from "../../src/interfaces/UserDTO";

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
    category: ReportCategory.ROAD_SIGNS_AND_TRAFFIC_LIGHTS,
    status: ReportStatus.PENDING_APPROVAL,
    latitude: 45.0703,
    longitude: 7.6869,
    street_name: "Via Roma",
    street_number: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
    user: null as any,
    assignedToId: null,
    assignedTo: null as any,
    photos: [],
    messages: [],
    ...overrides,
  } as Report;
}

// 重新导出 Role 枚举，方便测试文件使用
export { Role };
