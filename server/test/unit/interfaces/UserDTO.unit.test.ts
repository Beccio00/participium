import {
  toMunicipalityUserDTO,
  Roles,
  isValidRole,
  MUNICIPALITY_ROLES,
  toUserDTO,
  UserDTO,
} from "../../../src/interfaces/UserDTO";
import { User } from "../../../src/entities/User";
import { Role } from "../../../../shared/RoleTypes";

// 辅助函数：创建完整的 mock User 对象
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    password: "hashed",
    salt: "salt",
    role: [Role.CITIZEN],
    telegram_username: null,
    email_notifications_enabled: true,
    reports: [],
    messages: [],
    assignedReports: [],
    notifications: [],
    photo: null as any,
    ...overrides,
  } as User;
}

describe("UserDTO", () => {
  describe("toMunicipalityUserDTO", () => {
    it("maps user to municipality DTO correctly", () => {
      const user = createMockUser({
        id: 5,
        first_name: "John",
        last_name: "Doe",
        email: "j@d.com",
        role: [Role.PUBLIC_RELATIONS],
      });
      const dto = toMunicipalityUserDTO(user);
      expect(dto).toMatchObject({
        id: 5,
        firstName: "John",
        lastName: "Doe",
        email: "j@d.com",
        role: [Role.PUBLIC_RELATIONS],
      });
    });

    it("handles missing optional fields gracefully", () => {
      const user = createMockUser({
        id: 6,
        email: "x@y.com",
        role: [Role.MUNICIPAL_BUILDING_MAINTENANCE],
      });
      const dto = toMunicipalityUserDTO(user);
      expect(dto.id).toBe(6);
      expect(dto.email).toBe("x@y.com");
      expect(dto.role).toEqual([Role.MUNICIPAL_BUILDING_MAINTENANCE]);
    });

    it("handles invalid role in municipality DTO", () => {
      const user = createMockUser({
        id: 7,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        role: "INVALID_ROLE" as any,
      });
      const dto = toMunicipalityUserDTO(user);
      expect(dto.role).toEqual(["INVALID_ROLE"]);
    });
  });

  describe("toUserDTO", () => {
    it("should convert User to UserDTO with all fields", () => {
      const user = createMockUser({
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        role: [Role.CITIZEN],
        telegram_username: "telegram",
        email_notifications_enabled: false,
      });

      const result = toUserDTO(user);

      expect(result).toEqual({
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: [Role.CITIZEN],
        isVerified: false,
        telegramUsername: "telegram",
        emailNotificationsEnabled: false,
      });
    });

    it("should handle null telegram_username", () => {
      const user = createMockUser({
        telegram_username: null,
      });

      const result = toUserDTO(user);

      expect(result.telegramUsername).toBeNull();
    });

    it("should handle null email_notifications_enabled (default to true)", () => {
      const user = createMockUser({
        email_notifications_enabled: null as any,
      });

      const result = toUserDTO(user);

      expect(result.emailNotificationsEnabled).toBe(true);
    });

    it("should convert role correctly", () => {
      const user = createMockUser({
        role: [Role.ADMINISTRATOR],
      });

      const result = toUserDTO(user);

      expect(result.role).toEqual([Role.ADMINISTRATOR]);
    });

    it("should handle invalid role in UserDTO", () => {
      const user = createMockUser({
        role: "INVALID_ROLE" as any,
      });

      const result = toUserDTO(user);

      expect(result.role).toEqual(["INVALID_ROLE"]);
    });

    it("should handle edge cases with empty strings", () => {
      const user = createMockUser({
        id: 2,
        email: "",
        first_name: "",
        last_name: "",
        telegram_username: "",
        email_notifications_enabled: false,
      });

      const result = toUserDTO(user);

      expect(result.firstName).toBe("");
      expect(result.lastName).toBe("");
      expect(result.email).toBe("");
      expect(result.telegramUsername).toBe("");
    });

    it("should handle all valid roles", () => {
      const roles = [Role.CITIZEN, Role.ADMINISTRATOR, Role.PUBLIC_RELATIONS];

      roles.forEach((role, index) => {
        const user = createMockUser({
          id: index + 10,
          email: `test${index}@example.com`,
          role: [role],
        });

        const result = toUserDTO(user);
        expect(result.role).toEqual([role]);
      });
    });
  });

  describe("isValidRole", () => {
    it("should return true for valid roles", () => {
      expect(isValidRole(Role.CITIZEN)).toBe(true);
      expect(isValidRole(Role.ADMINISTRATOR)).toBe(true);
      expect(isValidRole(Role.PUBLIC_RELATIONS)).toBe(true);
    });

    it("should return false for invalid roles", () => {
      expect(isValidRole("INVALID")).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });
  });

  describe("MUNICIPALITY_ROLES", () => {
    it("should contain expected municipality roles", () => {
      expect(MUNICIPALITY_ROLES).toContain(Role.PUBLIC_RELATIONS);
      expect(MUNICIPALITY_ROLES).toContain(Role.MUNICIPAL_BUILDING_MAINTENANCE);
    });

    it("should not contain CITIZEN role", () => {
      expect(MUNICIPALITY_ROLES).not.toContain(Role.CITIZEN);
    });
  });
});
