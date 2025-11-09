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
  });
});

describe("InvalidCredentialsError", () => {
  it("should create error with default message", () => {
    const error = new InvalidCredentialsError();

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid username or password");
  });

  it("should create error with custom message", () => {
    const error = new InvalidCredentialsError("Custom message");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Custom message");
  });
});
