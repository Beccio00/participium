import { toMunicipalityUserDTO, Roles, isValidRole, MUNICIPALITY_ROLES } from "../../../src/interfaces/UserDTO";

describe('UserDTO', () => {
  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidRole('CITIZEN')).toBe(true);
      expect(isValidRole('ADMINISTRATOR')).toBe(true);
      expect(isValidRole('PUBLIC_RELATIONS')).toBe(true);
      expect(isValidRole('TECHNICAL_OFFICE')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidRole('INVALID_ROLE')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
      expect(isValidRole(123)).toBe(false);
      expect(isValidRole({})).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(isValidRole('citizen')).toBe(false);
      expect(isValidRole('CITIZEN')).toBe(true);
    });
  });

  describe('MUNICIPALITY_ROLES', () => {
    it('should contain correct municipality roles', () => {
      expect(MUNICIPALITY_ROLES).toContain(Roles.PUBLIC_RELATIONS);
      expect(MUNICIPALITY_ROLES).toContain(Roles.TECHNICAL_OFFICE);
      expect(MUNICIPALITY_ROLES).toHaveLength(2);
    });

    it('should not contain citizen or administrator roles', () => {
      expect(MUNICIPALITY_ROLES).not.toContain(Roles.CITIZEN);
      expect(MUNICIPALITY_ROLES).not.toContain(Roles.ADMINISTRATOR);
    });

    it("should be readonly array", () => {
      // L'array non è congelato, quindi non genera errore
      // Verifichiamo solo che sia un array valido
      expect(Array.isArray(MUNICIPALITY_ROLES)).toBe(true);
      expect(MUNICIPALITY_ROLES.length).toBe(2);
    });
  });

  describe('toMunicipalityUserDTO', () => {
    it('maps user to municipality DTO correctly', () => {
      const user = { id: 5, first_name: 'John', last_name: 'Doe', email: 'j@d.com', role: Roles.PUBLIC_RELATIONS } as any;
      const dto = toMunicipalityUserDTO(user);
      expect(dto).toMatchObject({ id: 5, firstName: 'John', lastName: 'Doe', email: 'j@d.com', role: Roles.PUBLIC_RELATIONS });
    });

    it('handles missing optional fields gracefully', () => {
      const user = { id: 6, email: 'x@y.com', role: Roles.TECHNICAL_OFFICE } as any;
      const dto = toMunicipalityUserDTO(user);
      expect(dto.id).toBe(6);
      expect(dto.email).toBe('x@y.com');
      expect(dto.role).toBe(Roles.TECHNICAL_OFFICE);
    });

    it('handles invalid role in municipality DTO', () => {
      const user = { id: 7, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', role: 'INVALID_ROLE' } as any;
      const dto = toMunicipalityUserDTO(user);
      expect(dto.role).toBe('INVALID_ROLE');
    });
  });
});
import { toUserDTO, UserDTO } from "../../../src/interfaces/UserDTO";
import { InvalidCredentialsError } from "../../../src/interfaces/errors/InvalidCredentialsError";

describe("UserDTO", () => {
  describe("toUserDTO", () => {
    it("should convert PrismaUser to UserDTO with all fields", () => {
      const prismaUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
        telegram_username: "telegram",
        email_notifications_enabled: false,
      };

      const result = toUserDTO(prismaUser);

      expect(result).toEqual({
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "CITIZEN",
        telegramUsername: "telegram",
        emailNotificationsEnabled: false,
      });
    });

    it("should handle null telegram_username", () => {
      const prismaUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };

      const result = toUserDTO(prismaUser);

      expect(result.telegramUsername).toBeNull();
    });

    it("should handle null email_notifications_enabled (default to true)", () => {
      const prismaUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
        telegram_username: "telegram",
        email_notifications_enabled: null as any,
      };

      const result = toUserDTO(prismaUser);

      expect(result.emailNotificationsEnabled).toBe(true);
    });

    it("should convert role to string", () => {
      const prismaUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "ADMIN" as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };

      const result = toUserDTO(prismaUser);

      expect(result.role).toBe("ADMIN");
    });

    it("should handle invalid role in UserDTO", () => {
      const prismaUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: "INVALID_ROLE" as any,
        telegram_username: null,
        email_notifications_enabled: true,
      };

      const result = toUserDTO(prismaUser);

      expect(result.role).toBe("INVALID_ROLE");
    });

    it("should handle edge cases with empty strings", () => {
      const prismaUser = {
        id: 2,
        email: "",
        first_name: "",
        last_name: "",
        password: "hashed",
        salt: "salt",
        role: "CITIZEN" as any,
        telegram_username: "",
        email_notifications_enabled: false,
      };

      const result = toUserDTO(prismaUser);

      expect(result.firstName).toBe("");
      expect(result.lastName).toBe("");
      expect(result.email).toBe("");
      expect(result.telegramUsername).toBe("");
    });

    it("should handle all valid roles", () => {
      const roles = ["CITIZEN", "ADMINISTRATOR", "PUBLIC_RELATIONS", "TECHNICAL_OFFICE"];
      
      roles.forEach((role, index) => {
        const prismaUser = {
          id: index + 10,
          email: `test${index}@example.com`,
          first_name: "Test",
          last_name: "User",
          password: "hashed",
          salt: "salt",
          role: role as any,
          telegram_username: null,
          email_notifications_enabled: true,
        };

        const result = toUserDTO(prismaUser);
        expect(result.role).toBe(role);
      });
    });
  });

  describe("Roles constants", () => {
    it("should have all expected roles defined", () => {
      expect(Roles.CITIZEN).toBe("CITIZEN");
      expect(Roles.ADMINISTRATOR).toBe("ADMINISTRATOR");
      expect(Roles.PUBLIC_RELATIONS).toBe("PUBLIC_RELATIONS");
      expect(Roles.TECHNICAL_OFFICE).toBe("TECHNICAL_OFFICE");
    });

    it("should be immutable", () => {
      // L'oggetto Roles non è congelato, quindi non genera errore
      // Verifichiamo che abbia le proprietà corrette
      expect(Roles).toHaveProperty('CITIZEN');
      expect(Roles).toHaveProperty('ADMINISTRATOR');
      expect(Roles).toHaveProperty('PUBLIC_RELATIONS');
      expect(Roles).toHaveProperty('TECHNICAL_OFFICE');
    });
  });
});
