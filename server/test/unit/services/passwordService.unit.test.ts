// Mock bcrypt
jest.mock("bcrypt");

import bcrypt from "bcrypt";
import {
  hashPassword,
  verifyPassword,
} from "../../../src/services/passwordService";
const mockBcrypt = jest.mocked(bcrypt) as any;

describe("passwordService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should generate salt and hash password", async () => {
      const plain = "password123";
      const mockSalt = "salt123";
      const mockHash = "hashed123";

      mockBcrypt.genSalt.mockResolvedValue(mockSalt);
      mockBcrypt.hash.mockResolvedValue(mockHash);

      const result = await hashPassword(plain);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(plain, mockSalt);
      expect(result).toEqual({ hashedPassword: mockHash, salt: mockSalt });
    });

    it("should handle bcrypt errors in genSalt", async () => {
      const error = new Error("Salt error");
      mockBcrypt.genSalt.mockRejectedValue(error);

      await expect(hashPassword("password")).rejects.toThrow(error);
    });

    it("should handle bcrypt errors in hash", async () => {
      const mockSalt = "salt123";
      const error = new Error("Hash error");

      mockBcrypt.genSalt.mockResolvedValue(mockSalt);
      mockBcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword("password")).rejects.toThrow(error);
    });
  });

  describe("verifyPassword", () => {
    it("should return false if dbUser is null", async () => {
      const result = await verifyPassword(null, "password");

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return false if dbUser is undefined", async () => {
      const result = await verifyPassword(undefined, "password");

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return false if dbUser has no password", async () => {
      const dbUser = { id: 1, email: "test@example.com" } as any;

      const result = await verifyPassword(dbUser, "password");

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return true if password matches", async () => {
      const dbUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed",
      } as any;
      const password = "password123";

      mockBcrypt.compare.mockResolvedValue(true);

      const result = await verifyPassword(dbUser, password);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, "hashed");
      expect(result).toBe(true);
    });

    it("should return false if password does not match", async () => {
      const dbUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed",
      } as any;
      const password = "wrongpassword";

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await verifyPassword(dbUser, password);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, "hashed");
      expect(result).toBe(false);
    });

    it("should handle bcrypt compare errors", async () => {
      const dbUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed",
      } as any;
      const error = new Error("Compare error");

      mockBcrypt.compare.mockRejectedValue(error);

      await expect(verifyPassword(dbUser, "password")).rejects.toThrow(error);
    });
  });
});
