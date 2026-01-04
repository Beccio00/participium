import { Request, Response } from "express";
import {
  generateToken,
  linkAccount,
  getStatus,
  unlink,
  createReport,
  checkLinked,
} from "../../../src/controllers/telegramController";
import {
  generateTelegramLinkToken,
  linkTelegramAccount,
  getTelegramStatus,
  unlinkTelegramAccount,
  createReportFromTelegram,
} from "../../../src/services/telegramService";
import { UserRepository } from "../../../src/repositories/UserRepository";
import type {
  TelegramLinkRequestDTO,
  TelegramCreateReportRequestDTO,
} from "../../../src/interfaces/TelegramDTO";

jest.mock("../../../src/services/telegramService");
jest.mock("../../../src/repositories/UserRepository");

const mockGenerateTelegramLinkToken = generateTelegramLinkToken as jest.MockedFunction<
  typeof generateTelegramLinkToken
>;
const mockLinkTelegramAccount = linkTelegramAccount as jest.MockedFunction<
  typeof linkTelegramAccount
>;
const mockGetTelegramStatus = getTelegramStatus as jest.MockedFunction<
  typeof getTelegramStatus
>;
const mockUnlinkTelegramAccount = unlinkTelegramAccount as jest.MockedFunction<
  typeof unlinkTelegramAccount
>;
const mockCreateReportFromTelegram = createReportFromTelegram as jest.MockedFunction<
  typeof createReportFromTelegram
>;

const mockFindByTelegramId = jest.fn();
const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe("telegramController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1 },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    MockUserRepository.mockImplementation(() => ({
      findByTelegramId: mockFindByTelegramId,
    }) as any);

    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate token for authenticated user", async () => {
      const mockTokenResponse = {
        token: "ABC123",
        expiresAt: "2024-01-01T12:00:00.000Z",
        deepLink: "https://t.me/participium_bot?start=link_ABC123",
        message: "Click the link to connect your Telegram account",
      };

      mockGenerateTelegramLinkToken.mockResolvedValue(mockTokenResponse);

      await generateToken(mockReq as Request, mockRes as Response);

      expect(mockGenerateTelegramLinkToken).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockTokenResponse);
    });

    it("should handle service errors", async () => {
      const error = new Error("Token generation failed");
      mockGenerateTelegramLinkToken.mockRejectedValue(error);

      await expect(
        generateToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Token generation failed");

      expect(mockGenerateTelegramLinkToken).toHaveBeenCalledWith(1);
    });

    it("should extract user ID from request correctly", async () => {
      const mockTokenResponse = {
        token: "XYZ789",
        expiresAt: "2024-01-01T12:00:00.000Z",
        deepLink: "https://t.me/participium_bot?start=link_XYZ789",
        message: "Click the link to connect your Telegram account",
      };

      mockReq.user = { id: 999 };
      mockGenerateTelegramLinkToken.mockResolvedValue(mockTokenResponse);

      await generateToken(mockReq as Request, mockRes as Response);

      expect(mockGenerateTelegramLinkToken).toHaveBeenCalledWith(999);
    });
  });

  describe("linkAccount", () => {
    it("should link telegram account successfully", async () => {
      const linkRequest: TelegramLinkRequestDTO = {
        token: "ABC123",
        telegramId: "123456789",
        telegramUsername: "johnDoe",
      };

      const mockLinkResponse = {
        success: true,
        message: "Telegram account linked successfully",
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockReq.body = linkRequest;
      mockLinkTelegramAccount.mockResolvedValue(mockLinkResponse);

      await linkAccount(mockReq as Request, mockRes as Response);

      expect(mockLinkTelegramAccount).toHaveBeenCalledWith(
        "ABC123",
        "123456789",
        "johnDoe"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockLinkResponse);
    });

    it("should handle link request without username", async () => {
      const linkRequest: TelegramLinkRequestDTO = {
        token: "ABC123",
        telegramId: "123456789",
      };

      const mockLinkResponse = {
        success: true,
        message: "Telegram account linked successfully",
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockReq.body = linkRequest;
      mockLinkTelegramAccount.mockResolvedValue(mockLinkResponse);

      await linkAccount(mockReq as Request, mockRes as Response);

      expect(mockLinkTelegramAccount).toHaveBeenCalledWith(
        "ABC123",
        "123456789",
        undefined
      );
    });

    it("should handle service errors", async () => {
      const linkRequest: TelegramLinkRequestDTO = {
        token: "INVALID",
        telegramId: "123456789",
      };

      mockReq.body = linkRequest;
      const error = new Error("Invalid token");
      mockLinkTelegramAccount.mockRejectedValue(error);

      await expect(
        linkAccount(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid token");
    });
  });

  describe("getStatus", () => {
    it("should return telegram status for authenticated user", async () => {
      const mockStatusResponse = {
        linked: true,
        telegramUsername: "johnDoe",
        telegramId: "123456789",
      };

      mockGetTelegramStatus.mockResolvedValue(mockStatusResponse);

      await getStatus(mockReq as Request, mockRes as Response);

      expect(mockGetTelegramStatus).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStatusResponse);
    });

    it("should return unlinked status", async () => {
      const mockStatusResponse = {
        linked: false,
        telegramUsername: null,
        telegramId: null,
      };

      mockGetTelegramStatus.mockResolvedValue(mockStatusResponse);

      await getStatus(mockReq as Request, mockRes as Response);

      expect(mockGetTelegramStatus).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockStatusResponse);
    });

    it("should handle service errors", async () => {
      const error = new Error("User not found");
      mockGetTelegramStatus.mockRejectedValue(error);

      await expect(
        getStatus(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("User not found");
    });
  });

  describe("unlink", () => {
    it("should unlink telegram account successfully", async () => {
      const mockUnlinkResponse = {
        success: true,
        message: "Telegram account unlinked successfully",
      };

      mockUnlinkTelegramAccount.mockResolvedValue(mockUnlinkResponse);

      await unlink(mockReq as Request, mockRes as Response);

      expect(mockUnlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUnlinkResponse);
    });

    it("should handle unlink errors", async () => {
      const error = new Error("No telegram account linked");
      mockUnlinkTelegramAccount.mockRejectedValue(error);

      await expect(
        unlink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("No telegram account linked");
    });

    it("should use correct user ID from request", async () => {
      const mockUnlinkResponse = {
        success: true,
        message: "Telegram account unlinked successfully",
      };

      mockReq.user = { id: 456 };
      mockUnlinkTelegramAccount.mockResolvedValue(mockUnlinkResponse);

      await unlink(mockReq as Request, mockRes as Response);

      expect(mockUnlinkTelegramAccount).toHaveBeenCalledWith(456);
    });
  });

  describe("createReport", () => {
    it("should create report from telegram successfully", async () => {
      const reportRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "Broken streetlight",
        description: "The streetlight on Main Street is not working",
        category: "PUBLIC_LIGHTING",
        latitude: 45.0703,
        longitude: 7.6869,
        isAnonymous: false,
        photoFileIds: ["file1", "file2"],
      };

      const mockReportResponse = {
        success: true,
        message: "Report created successfully",
        reportId: 123,
      };

      mockReq.body = reportRequest;
      mockCreateReportFromTelegram.mockResolvedValue(mockReportResponse);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportFromTelegram).toHaveBeenCalledWith(reportRequest);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockReportResponse);
    });

    it("should handle minimal report request", async () => {
      const reportRequest: TelegramCreateReportRequestDTO = {
        telegramId: "123456789",
        title: "Simple report",
        description: "Simple description",
        category: "ROADS_URBAN_FURNISHINGS",
        latitude: 45.0703,
        longitude: 7.6869,
      };

      const mockReportResponse = {
        success: true,
        message: "Report created successfully",
        reportId: 456,
      };

      mockReq.body = reportRequest;
      mockCreateReportFromTelegram.mockResolvedValue(mockReportResponse);

      await createReport(mockReq as Request, mockRes as Response);

      expect(mockCreateReportFromTelegram).toHaveBeenCalledWith(reportRequest);
    });

    it("should handle service errors", async () => {
      const reportRequest: TelegramCreateReportRequestDTO = {
        telegramId: "invalid",
        title: "Test",
        description: "Test description",
        category: "TEST",
        latitude: 45.0703,
        longitude: 7.6869,
      };

      mockReq.body = reportRequest;
      const error = new Error("Invalid telegram ID");
      mockCreateReportFromTelegram.mockRejectedValue(error);

      await expect(
        createReport(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Invalid telegram ID");
    });
  });

  describe("checkLinked", () => {
    it("should return linked status when user exists", async () => {
      const mockUser = {
        id: 1,
        telegram_id: "123456789",
        first_name: "John",
        last_name: "Doe",
      };

      mockReq.body = { telegramId: "123456789" };
      mockFindByTelegramId.mockResolvedValue(mockUser);

      await checkLinked(mockReq as Request, mockRes as Response);

      expect(mockFindByTelegramId).toHaveBeenCalledWith("123456789");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ linked: true });
    });

    it("should return unlinked status when user does not exist", async () => {
      mockReq.body = { telegramId: "999999999" };
      mockFindByTelegramId.mockResolvedValue(null);

      await checkLinked(mockReq as Request, mockRes as Response);

      expect(mockFindByTelegramId).toHaveBeenCalledWith("999999999");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ linked: false });
    });

    it("should return error when telegramId is missing", async () => {
      mockReq.body = {};

      await checkLinked(mockReq as Request, mockRes as Response);

      expect(mockFindByTelegramId).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        linked: false,
        message: "telegramId is required",
      });
    });

    it("should return error when telegramId is empty string", async () => {
      mockReq.body = { telegramId: "" };

      await checkLinked(mockReq as Request, mockRes as Response);

      expect(mockFindByTelegramId).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        linked: false,
        message: "telegramId is required",
      });
    });

    it("should return error when telegramId is null", async () => {
      mockReq.body = { telegramId: null };

      await checkLinked(mockReq as Request, mockRes as Response);

      expect(mockFindByTelegramId).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        linked: false,
        message: "telegramId is required",
      });
    });

    it("should handle repository errors", async () => {
      mockReq.body = { telegramId: "123456789" };
      const error = new Error("Database connection failed");
      mockFindByTelegramId.mockRejectedValue(error);

      await expect(
        checkLinked(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Database connection failed");

      expect(mockFindByTelegramId).toHaveBeenCalledWith("123456789");
    });
  });

  describe("Integration tests", () => {
    it("should handle all controller methods with proper response format", async () => {
      // Test that all methods use proper response structure
      const mockTokenResponse = {
        token: "ABC123",
        expiresAt: "2024-01-01T12:00:00.000Z",
        deepLink: "https://t.me/participium_bot?start=link_ABC123",
        message: "Click the link",
      };

      mockGenerateTelegramLinkToken.mockResolvedValue(mockTokenResponse);

      await generateToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          message: expect.any(String),
        })
      );
    });

    it("should maintain consistent error handling across methods", async () => {
      const error = new Error("Service unavailable");

      // Test generateToken error handling
      mockGenerateTelegramLinkToken.mockRejectedValue(error);
      await expect(
        generateToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Service unavailable");

      // Test getStatus error handling
      mockGetTelegramStatus.mockRejectedValue(error);
      await expect(
        getStatus(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Service unavailable");

      // Test unlink error handling
      mockUnlinkTelegramAccount.mockRejectedValue(error);
      await expect(
        unlink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow("Service unavailable");
    });
  });
});