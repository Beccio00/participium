"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserDTO_1 = require("../../../src/interfaces/UserDTO");
describe('UserDTO', () => {
    describe('toMunicipalityUserDTO', () => {
        it('maps user to municipality DTO correctly', () => {
            const user = { id: 5, first_name: 'John', last_name: 'Doe', email: 'j@d.com', role: UserDTO_1.Roles.PUBLIC_RELATIONS };
            const dto = (0, UserDTO_1.toMunicipalityUserDTO)(user);
            expect(dto).toMatchObject({ id: 5, firstName: 'John', lastName: 'Doe', email: 'j@d.com', role: UserDTO_1.Roles.PUBLIC_RELATIONS });
        });
        it('handles missing optional fields gracefully', () => {
            const user = { id: 6, email: 'x@y.com', role: UserDTO_1.Roles.TECHNICAL_OFFICE };
            const dto = (0, UserDTO_1.toMunicipalityUserDTO)(user);
            expect(dto.id).toBe(6);
            expect(dto.email).toBe('x@y.com');
            expect(dto.role).toBe(UserDTO_1.Roles.TECHNICAL_OFFICE);
        });
    });
});
const UserDTO_2 = require("../../../src/interfaces/UserDTO");
const InvalidCredentialsError_1 = require("../../../src/interfaces/errors/InvalidCredentialsError");
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
                role: "CITIZEN",
                telegram_username: "telegram",
                email_notifications_enabled: false,
            };
            const result = (0, UserDTO_2.toUserDTO)(prismaUser);
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
                role: "CITIZEN",
                telegram_username: null,
                email_notifications_enabled: true,
            };
            const result = (0, UserDTO_2.toUserDTO)(prismaUser);
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
                role: "CITIZEN",
                telegram_username: "telegram",
                email_notifications_enabled: null,
            };
            const result = (0, UserDTO_2.toUserDTO)(prismaUser);
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
                role: "ADMIN",
                telegram_username: null,
                email_notifications_enabled: true,
            };
            const result = (0, UserDTO_2.toUserDTO)(prismaUser);
            expect(result.role).toBe("ADMIN");
        });
    });
});
describe("InvalidCredentialsError", () => {
    it("should create error with default message", () => {
        const error = new InvalidCredentialsError_1.InvalidCredentialsError();
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Invalid username or password");
    });
    it("should create error with custom message", () => {
        const error = new InvalidCredentialsError_1.InvalidCredentialsError("Custom message");
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Custom message");
    });
});
