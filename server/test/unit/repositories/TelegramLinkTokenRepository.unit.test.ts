import { Repository, LessThan } from "typeorm";
import { TelegramLinkTokenRepository } from "../../../src/repositories/TelegramLinkTokenRepository";
import { TelegramLinkToken } from "../../../src/entities/TelegramLinkToken";
import { AppDataSource } from "../../../src/utils/AppDataSource";

jest.mock("../../../src/utils/AppDataSource");

describe("TelegramLinkTokenRepository Unit Tests", () => {
  let telegramLinkTokenRepository: TelegramLinkTokenRepository;
  let mockRepository: jest.Mocked<Repository<TelegramLinkToken>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    telegramLinkTokenRepository = new TelegramLinkTokenRepository();
  });

  describe("create", () => {
    it("should create and save a new telegram link token", async () => {
      const tokenData = {
        token: "ABC123",
        userId: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      };

      const mockCreatedToken = {
        id: 1,
        ...tokenData,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCreatedToken as any);
      mockRepository.save.mockResolvedValue(mockCreatedToken as any);

      const result = await telegramLinkTokenRepository.create(tokenData);

      expect(mockRepository.create).toHaveBeenCalledWith(tokenData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedToken);
      expect(result).toEqual(mockCreatedToken);
    });

    it("should create token with partial data", async () => {
      const partialData = {
        token: "XYZ789",
        userId: 2,
      };

      const mockCreatedToken = {
        id: 2,
        ...partialData,
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCreatedToken as any);
      mockRepository.save.mockResolvedValue(mockCreatedToken as any);

      const result = await telegramLinkTokenRepository.create(partialData);

      expect(mockRepository.create).toHaveBeenCalledWith(partialData);
      expect(result).toEqual(mockCreatedToken);
    });
  });

  describe("findByToken", () => {
    it("should return token by token string with user relation", async () => {
      const mockToken = {
        id: 1,
        token: "ABC123",
        userId: 1,
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockToken as any);

      const result = await telegramLinkTokenRepository.findByToken("ABC123");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token: "ABC123" },
        relations: ["user"],
      });
      expect(result).toEqual(mockToken);
      expect(result?.user).toBeDefined();
    });

    it("should return null if token not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findByToken("INVALID");

      expect(result).toBeNull();
    });
  });

  describe("findValidByToken", () => {
    it("should return valid unused token with user relation", async () => {
      const mockToken = {
        id: 1,
        token: "ABC123",
        userId: 1,
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockToken as any);

      const result = await telegramLinkTokenRepository.findValidByToken("ABC123");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          token: "ABC123",
          used: false,
        },
        relations: ["user"],
      });
      expect(result).toEqual(mockToken);
    });

    it("should return null for used token", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findValidByToken("USED_TOKEN");

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should return latest token for user", async () => {
      const mockToken = {
        id: 1,
        token: "ABC123",
        userId: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockToken as any);

      const result = await telegramLinkTokenRepository.findByUserId(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockToken);
    });

    it("should return null if no token found for user", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe("findValidByUserId", () => {
    it("should return latest valid unused token for user", async () => {
      const mockToken = {
        id: 1,
        token: "ABC123",
        userId: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockToken as any);

      const result = await telegramLinkTokenRepository.findValidByUserId(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 1,
          used: false,
        },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockToken);
    });

    it("should return null if no valid token found for user", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findValidByUserId(1);

      expect(result).toBeNull();
    });
  });

  describe("markAsUsed", () => {
    it("should update token as used", async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      await telegramLinkTokenRepository.markAsUsed(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { used: true });
    });

    it("should handle update when no rows affected", async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      await telegramLinkTokenRepository.markAsUsed(999);

      expect(mockRepository.update).toHaveBeenCalledWith(999, { used: true });
    });
  });

  describe("deleteByUserId", () => {
    it("should delete all tokens for user", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 2 } as any);

      await telegramLinkTokenRepository.deleteByUserId(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 1 });
    });

    it("should handle deletion when no tokens exist for user", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await telegramLinkTokenRepository.deleteByUserId(999);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 999 });
    });
  });

  describe("deleteExpiredTokens", () => {
    it("should delete expired tokens and return count", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 5 } as any);

      const result = await telegramLinkTokenRepository.deleteExpiredTokens();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object), // LessThan(new Date())
      });
      expect(result).toBe(5);
    });

    it("should return 0 when no expired tokens exist", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await telegramLinkTokenRepository.deleteExpiredTokens();

      expect(result).toBe(0);
    });

    it("should handle undefined affected count", async () => {
      mockRepository.delete.mockResolvedValue({ affected: undefined } as any);

      const result = await telegramLinkTokenRepository.deleteExpiredTokens();

      expect(result).toBe(0);
    });

    it("should use LessThan with current date", async () => {
      const beforeCall = new Date();
      mockRepository.delete.mockResolvedValue({ affected: 3 } as any);

      await telegramLinkTokenRepository.deleteExpiredTokens();

      const afterCall = new Date();
      const deleteCall = mockRepository.delete.mock.calls[0][0];
      
      // Verify that LessThan was called with expiresAt
      if (typeof deleteCall === "object" && deleteCall !== null && "expiresAt" in deleteCall) {
        expect(deleteCall).toHaveProperty('expiresAt');
        expect(deleteCall.expiresAt).toBeDefined();

        // Check that it's a FindOperator (LessThan creates a FindOperator)
        if (deleteCall.expiresAt) {
          expect(deleteCall.expiresAt.constructor.name).toBe('FindOperator');
        }
      } else {
        throw new Error("deleteCall does not have an expiresAt property");
      }
      
      // Verify the date value is reasonable (between before and after call)
      if (deleteCall.expiresAt && typeof deleteCall.expiresAt === 'object' && '_value' in deleteCall.expiresAt) {
        const dateValue = (deleteCall.expiresAt as any)._value;
        if (dateValue instanceof Date) {
          expect(dateValue.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
          expect(dateValue.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
        }
      }
    });
  });

  describe("error handling", () => {
    it("should propagate database errors from create", async () => {
      const error = new Error("Database connection failed");
      mockRepository.save.mockRejectedValue(error);

      await expect(
        telegramLinkTokenRepository.create({ token: "TEST", userId: 1 })
      ).rejects.toThrow("Database connection failed");
    });

    it("should propagate database errors from findByToken", async () => {
      const error = new Error("Database query failed");
      mockRepository.findOne.mockRejectedValue(error);

      await expect(
        telegramLinkTokenRepository.findByToken("ABC123")
      ).rejects.toThrow("Database query failed");
    });

    it("should propagate database errors from markAsUsed", async () => {
      const error = new Error("Database update failed");
      mockRepository.update.mockRejectedValue(error);

      await expect(
        telegramLinkTokenRepository.markAsUsed(1)
      ).rejects.toThrow("Database update failed");
    });

    it("should propagate database errors from deleteByUserId", async () => {
      const error = new Error("Database delete failed");
      mockRepository.delete.mockRejectedValue(error);

      await expect(
        telegramLinkTokenRepository.deleteByUserId(1)
      ).rejects.toThrow("Database delete failed");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string token", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findByToken("");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token: "" },
        relations: ["user"],
      });
      expect(result).toBeNull();
    });

    it("should handle very long token string", async () => {
      const longToken = "A".repeat(100);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findByToken(longToken);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token: longToken },
        relations: ["user"],
      });
      expect(result).toBeNull();
    });

    it("should handle negative user IDs", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await telegramLinkTokenRepository.findByUserId(-1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: -1 },
        order: { createdAt: "DESC" },
      });
      expect(result).toBeNull();
    });

    it("should handle zero user ID", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await telegramLinkTokenRepository.deleteByUserId(0);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 0 });
    });
  });
});