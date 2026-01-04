import { ReportCategory } from "../../../src/interfaces/ReportDTO";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../src/utils";

// Impostare le variabili d'ambiente PRIMA di qualsiasi import del servizio
process.env.TELEGRAM_BOT_USERNAME = "participium_bot";
process.env.TELEGRAM_BOT_TOKEN = "test_token";

// Creare le mock functions prima dei jest.mock()
const mockFindById = jest.fn();
const mockFindByTelegramId = jest.fn();
const mockUpdateUser = jest.fn();

const mockCreateToken = jest.fn();
const mockFindByToken = jest.fn();
const mockDeleteByUserId = jest.fn();
const mockMarkAsUsed = jest.fn();

const mockRandomBytes = jest.fn();
const mockAxiosGet = jest.fn();
const mockCreateReport = jest.fn();
const mockCalculateAddress = jest.fn();
const mockIsPointInTurin = jest.fn();
const mockPutObject = jest.fn();

// Mock dependencies con factory functions
jest.mock("crypto", () => ({
  randomBytes: mockRandomBytes,
}));

jest.mock("axios", () => ({
  get: mockAxiosGet,
}));

jest.mock("../../../src/repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    findByTelegramId: mockFindByTelegramId,
    update: mockUpdateUser,
  })),
}));

jest.mock("../../../src/repositories/TelegramLinkTokenRepository", () => ({
  TelegramLinkTokenRepository: jest.fn().mockImplementation(() => ({
    create: mockCreateToken,
    findByToken: mockFindByToken,
    deleteByUserId: mockDeleteByUserId,
    markAsUsed: mockMarkAsUsed,
  })),
}));

jest.mock("../../../src/services/reportService", () => ({
  createReport: mockCreateReport,
}));

jest.mock("../../../src/utils/addressFinder", () => ({
  calculateAddress: mockCalculateAddress,
}));

jest.mock("../../../../shared/TurinBoundaries", () => ({
  isPointInTurin: mockIsPointInTurin,
}));

jest.mock("../../../src/utils/minioClient", () => ({
  __esModule: true,
  default: {
    putObject: mockPutObject,
  },
  BUCKET_NAME: "test-bucket",
}));

// Ora importare i servizi
import {
  generateTelegramLinkToken,
  linkTelegramAccount,
  getTelegramStatus,
  unlinkTelegramAccount,
  createReportFromTelegram,
} from "../../../src/services/telegramService";

describe("TelegramService", () => {
  // Mock data
  const mockUser = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    telegram_id: null,
    telegram_username: null,
    password: "hashedPassword",
    salt: "salt",
    role: "CITIZEN",
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockUserWithTelegram = {
    ...mockUser,
    telegram_id: "123456789",
    telegram_username: "johnDoe",
  } as any;

  const mockToken = {
    id: 1,
    token: "ABC123",
    userId: 1,
    user: mockUser,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    used: false,
    createdAt: new Date(),
  };

  const mockReport = {
    id: 1,
    title: "Test Report",
    description: "Test Description",
    category: ReportCategory.ROADS_URBAN_FURNISHINGS,
    latitude: 45.0703,
    longitude: 7.6869,
    address: "Test Address",
    isAnonymous: false,
    userId: 1,
    photos: [],
    status: "PENDING_APPROVAL",
    assignedOfficerId: null,
    externalMaintainerId: null,
    externalCompanyId: null,
    rejectedReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Environment variables già impostate all'inizio del file
    process.env.MINIO_USE_SSL = "false";
    process.env.MINIO_PORT = "9000";

    // Setup crypto mock
    mockRandomBytes.mockReturnValue(Buffer.from([0, 5, 10, 15, 20, 25]));

    // Setup default utility mocks
    mockIsPointInTurin.mockReturnValue(true);
    mockCalculateAddress.mockResolvedValue("Test Address, Turin");
  });

  describe("generateTelegramLinkToken", () => {
    it("should generate a token for a valid user without existing Telegram account", async () => {
      mockFindById.mockResolvedValue(mockUser);
      mockCreateToken.mockResolvedValue(mockToken);

      const result = await generateTelegramLinkToken(1);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockDeleteByUserId).toHaveBeenCalledWith(1);
      expect(mockCreateToken).toHaveBeenCalledWith({
        token: expect.any(String), // Token generato dinamicamente
        userId: 1,
        expiresAt: expect.any(Date),
        used: false,
      });

      expect(result).toEqual({
        token: expect.any(String), // Token generato dinamicamente
        expiresAt: expect.any(String),
        deepLink: expect.stringContaining("https://t.me/participium_bot?start=link_"),
        message: "Click the link to connect your Telegram account",
      });
    });

    it("should throw NotFoundError if user does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(generateTelegramLinkToken(999)).rejects.toThrow(
        new NotFoundError("User not found")
      );

      expect(mockFindById).toHaveBeenCalledWith(999);
      expect(mockCreateToken).not.toHaveBeenCalled();
    });

    it("should throw ConflictError if user already has Telegram account linked", async () => {
      mockFindById.mockResolvedValue(mockUserWithTelegram);

      await expect(generateTelegramLinkToken(1)).rejects.toThrow(
        new ConflictError("Telegram account already linked to this user")
      );

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockCreateToken).not.toHaveBeenCalled();
    });

    it("should cleanup existing tokens before creating new one", async () => {
      mockFindById.mockResolvedValue(mockUser);
      mockCreateToken.mockResolvedValue(mockToken);

      await generateTelegramLinkToken(1);

      expect(mockDeleteByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("linkTelegramAccount", () => {
    it("should successfully link Telegram account with valid token", async () => {
      mockFindByToken.mockResolvedValue(mockToken);
      mockFindByTelegramId.mockResolvedValue(null);

      const result = await linkTelegramAccount("ABC123", "987654321", "testUser");

      expect(mockFindByToken).toHaveBeenCalledWith("ABC123");
      expect(mockFindByTelegramId).toHaveBeenCalledWith("987654321");
      expect(mockUpdateUser).toHaveBeenCalledWith(1, {
        telegram_id: "987654321",
        telegram_username: "testUser",
      });
      expect(mockMarkAsUsed).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        success: true,
        message: "Telegram account linked successfully",
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      });
    });

    it("should throw BadRequestError if token is missing", async () => {
      await expect(linkTelegramAccount("", "987654321")).rejects.toThrow(
        new BadRequestError("Token is required")
      );
    });

    it("should throw BadRequestError if telegramId is missing", async () => {
      await expect(linkTelegramAccount("ABC123", "")).rejects.toThrow(
        new BadRequestError("Telegram ID is required")
      );
    });

    it("should throw NotFoundError if token does not exist", async () => {
      mockFindByToken.mockResolvedValue(null);

      await expect(linkTelegramAccount("INVALID", "987654321")).rejects.toThrow(
        new NotFoundError("Invalid token")
      );
    });

    it("should throw ConflictError if token is already used", async () => {
      const usedToken = { ...mockToken, used: true };
      mockFindByToken.mockResolvedValue(usedToken);

      await expect(linkTelegramAccount("ABC123", "987654321")).rejects.toThrow(
        new ConflictError("Token has already been used")
      );
    });

    it("should throw BadRequestError if token is expired", async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      };
      mockFindByToken.mockResolvedValue(expiredToken);

      await expect(linkTelegramAccount("ABC123", "987654321")).rejects.toThrow(
        new BadRequestError("Token has expired")
      );
    });

    it("should throw ConflictError if Telegram ID is already linked to another user", async () => {
      const anotherUser = { ...mockUserWithTelegram, id: 2 };
      mockFindByToken.mockResolvedValue(mockToken);
      mockFindByTelegramId.mockResolvedValue(anotherUser);

      await expect(linkTelegramAccount("ABC123", "987654321")).rejects.toThrow(
        new ConflictError("This Telegram account is already linked to another user")
      );
    });

    it("should handle null telegram username", async () => {
      mockFindByToken.mockResolvedValue(mockToken);
      mockFindByTelegramId.mockResolvedValue(null);

      await linkTelegramAccount("ABC123", "987654321", null);

      expect(mockUpdateUser).toHaveBeenCalledWith(1, {
        telegram_id: "987654321",
        telegram_username: null,
      });
    });
  });

  describe("getTelegramStatus", () => {
    it("should return linked status for user with Telegram account", async () => {
      mockFindById.mockResolvedValue(mockUserWithTelegram);

      const result = await getTelegramStatus(1);

      expect(result).toEqual({
        linked: true,
        telegramUsername: "johnDoe",
        telegramId: "123456789",
      });
    });

    it("should return unlinked status for user without Telegram account", async () => {
      mockFindById.mockResolvedValue(mockUser);

      const result = await getTelegramStatus(1);

      expect(result).toEqual({
        linked: false,
        telegramUsername: null,
        telegramId: null,
      });
    });

    it("should throw NotFoundError if user does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(getTelegramStatus(999)).rejects.toThrow(
        new NotFoundError("User not found")
      );
    });
  });

  describe("unlinkTelegramAccount", () => {
    it("should successfully unlink Telegram account", async () => {
      mockFindById.mockResolvedValue(mockUserWithTelegram);

      const result = await unlinkTelegramAccount(1);

      expect(mockUpdateUser).toHaveBeenCalledWith(1, {
        telegram_id: null,
        telegram_username: null,
      });
      expect(mockDeleteByUserId).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        success: true,
        message: "Telegram account unlinked successfully",
      });
    });

    it("should throw NotFoundError if user does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(unlinkTelegramAccount(999)).rejects.toThrow(
        new NotFoundError("User not found")
      );
    });

    it("should throw NotFoundError if user has no Telegram account linked", async () => {
      mockFindById.mockResolvedValue(mockUser);

      await expect(unlinkTelegramAccount(1)).rejects.toThrow(
        new NotFoundError("No Telegram account linked to this user")
      );
    });
  });

  describe("createReportFromTelegram", () => {
    const mockReportRequest = {
      telegramId: "123456789",
      title: "Test Report",
      description: "This is a test report with sufficient length",
      category: ReportCategory.ROADS_URBAN_FURNISHINGS,
      latitude: 45.0703,
      longitude: 7.6869,
      isAnonymous: false,
      photoFileIds: ["file1", "file2"],
    };

    const mockTelegramFileResponse = {
      data: {
        ok: true,
        result: {
          file_path: "photos/file1.jpg",
        },
      },
    };

    const mockTelegramFileData = Buffer.from("fake-image-data");

    it("should successfully create a report from Telegram", async () => {
      // Setup per questo test
      process.env.TELEGRAM_BOT_TOKEN = "test_token";
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      mockCreateReport.mockResolvedValue(mockReport);
      
      // Setup axios mock per ogni file richiesto
      mockAxiosGet
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData })
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData });
      mockPutObject.mockResolvedValue({} as any);
      
      const result = await createReportFromTelegram(mockReportRequest);

      expect(mockFindByTelegramId).toHaveBeenCalledWith("123456789");
      expect(mockIsPointInTurin).toHaveBeenCalledWith(45.0703, 7.6869);
      expect(mockCalculateAddress).toHaveBeenCalledWith(45.0703, 7.6869);
      expect(mockCreateReport).toHaveBeenCalledWith({
        title: "Test Report",
        description: "This is a test report with sufficient length",
        category: ReportCategory.ROADS_URBAN_FURNISHINGS,
        latitude: 45.0703,
        longitude: 7.6869,
        address: "Test Address, Turin",
        isAnonymous: false,
        userId: 1,
        photos: expect.arrayContaining([
          expect.objectContaining({
            id: 0,
            url: expect.stringContaining("telegram-"),
            filename: expect.stringContaining("telegram-"),
          }),
        ]),
      });

      expect(result).toEqual({
        success: true,
        message: "Report created successfully",
        reportId: 1,
      });
    });

    it("should throw NotFoundError if Telegram ID is not linked", async () => {
      mockFindByTelegramId.mockResolvedValue(null);

      await expect(createReportFromTelegram(mockReportRequest)).rejects.toThrow(
        new NotFoundError("No account linked to this Telegram ID. Please link your account first.")
      );
    });

    it("should throw BadRequestError for invalid category", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, category: "INVALID_CATEGORY" };

      await expect(createReportFromTelegram(invalidRequest as any)).rejects.toThrow(
        new BadRequestError("Invalid category: INVALID_CATEGORY")
      );
    });

    it("should throw BadRequestError for missing title", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, title: "" };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Title is required")
      );
    });

    it("should throw BadRequestError for missing description", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, description: "" };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Description is required")
      );
    });

    it("should throw BadRequestError for too short description", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, description: "short" };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Description is too short. Please provide at least 10 characters")
      );
    });

    it("should throw BadRequestError for too long description", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = {
        ...mockReportRequest,
        description: "a".repeat(1001),
      };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Description is too long. Please keep it under 1000 characters")
      );
    });

    it("should throw BadRequestError for invalid coordinates type", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, latitude: "invalid" as any };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Valid latitude and longitude are required")
      );
    });

    it("should throw BadRequestError for NaN coordinates", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, latitude: NaN };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Invalid coordinates: latitude and longitude must be valid numbers")
      );
    });

    it("should throw BadRequestError for latitude out of range", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, latitude: 95 };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Invalid latitude: must be between -90 and 90")
      );
    });

    it("should throw BadRequestError for longitude out of range", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, longitude: 185 };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Invalid longitude: must be between -180 and 180")
      );
    });

    it("should throw UnprocessableEntityError for coordinates outside Turin", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      mockIsPointInTurin.mockReturnValue(false);

      await expect(createReportFromTelegram(mockReportRequest)).rejects.toThrow(
        new UnprocessableEntityError("Coordinates are outside Turin municipality boundaries")
      );
    });

    it("should throw BadRequestError for missing photos", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = { ...mockReportRequest, photoFileIds: [] };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("At least one photo is required")
      );
    });

    it("should throw BadRequestError for too many photos", async () => {
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      const invalidRequest = {
        ...mockReportRequest,
        photoFileIds: ["file1", "file2", "file3", "file4"],
      };

      await expect(createReportFromTelegram(invalidRequest)).rejects.toThrow(
        new BadRequestError("Maximum 3 photos allowed")
      );
    });

    it("should handle anonymous reports", async () => {
      // Setup per questo test
      process.env.TELEGRAM_BOT_TOKEN = "test_token";
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      mockCreateReport.mockResolvedValue(mockReport);
      
      // Setup axios mock per ogni file richiesto
      mockAxiosGet
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData })
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData });
      mockPutObject.mockResolvedValue({} as any);
      
      const anonymousRequest = { ...mockReportRequest, isAnonymous: true };

      await createReportFromTelegram(anonymousRequest);

      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          isAnonymous: true,
        })
      );
    });

    it("should default isAnonymous to false when not provided", async () => {
      // Setup per questo test
      process.env.TELEGRAM_BOT_TOKEN = "test_token";
      mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
      mockCreateReport.mockResolvedValue(mockReport);
      
      // Setup axios mock per ogni file richiesto
      mockAxiosGet
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData })
        .mockResolvedValueOnce(mockTelegramFileResponse)
        .mockResolvedValueOnce({ data: mockTelegramFileData });
      mockPutObject.mockResolvedValue({} as any);
      
      const requestWithoutAnonymous = { ...mockReportRequest };
      delete (requestWithoutAnonymous as any).isAnonymous;

      await createReportFromTelegram(requestWithoutAnonymous);

      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          isAnonymous: false,
        })
      );
    });

    describe("downloadAndUploadTelegramPhotos", () => {
      it("should throw error if BOT_TOKEN is not configured", async () => {
        // Creare una nuova funzione che importa il servizio dopo aver eliminato la variabile d'ambiente
        jest.resetModules();
        delete process.env.TELEGRAM_BOT_TOKEN;
        
        // Re-importare il servizio senza TELEGRAM_BOT_TOKEN
        const { createReportFromTelegram: createReportFromTelegramNoToken } = require("../../../src/services/telegramService");
        
        mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);

        await expect(createReportFromTelegramNoToken(mockReportRequest)).rejects.toThrow(
          "TELEGRAM_BOT_TOKEN not configured on server"
        );
        
        // Ripristina il token per i test successivi
        process.env.TELEGRAM_BOT_TOKEN = "test_token";
        jest.resetModules();
      });

      it("should handle failed Telegram API response", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "test_token";
        mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
        mockAxiosGet.mockResolvedValueOnce({
          data: { ok: false },
        });

        await expect(createReportFromTelegram(mockReportRequest)).rejects.toThrow(
          new BadRequestError("Failed to get file info from Telegram")
        );
      });

      it("should handle PNG files correctly", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "test_token";
        mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
        mockCreateReport.mockResolvedValue(mockReport);
        
        const pngFileResponse = {
          data: {
            ok: true,
            result: {
              file_path: "photos/file1.png",
            },
          },
        };

        mockAxiosGet
          .mockResolvedValueOnce(pngFileResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData })
          .mockResolvedValueOnce(pngFileResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData });

        await createReportFromTelegram(mockReportRequest);

        expect(mockPutObject).toHaveBeenCalledWith(
          "test-bucket",
          expect.stringContaining(".png"),
          expect.any(Buffer),
          expect.any(Number),
          { "Content-Type": "image/png" }
        );
      });

      it("should handle files without extension as JPG", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "test_token";
        mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
        mockCreateReport.mockResolvedValue(mockReport);
        
        const fileWithoutExtResponse = {
          data: {
            ok: true,
            result: {
              file_path: "photos/file1",
            },
          },
        };

        mockAxiosGet
          .mockResolvedValueOnce(fileWithoutExtResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData })
          .mockResolvedValueOnce(fileWithoutExtResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData });

        await createReportFromTelegram(mockReportRequest);

        expect(mockPutObject).toHaveBeenCalledWith(
          "test-bucket",
          expect.stringContaining(".jpg"),
          expect.any(Buffer),
          expect.any(Number),
          { "Content-Type": "image/jpeg" }
        );
      });

      it("should generate correct photo URLs with SSL configuration", async () => {
        process.env.TELEGRAM_BOT_TOKEN = "test_token";
        process.env.MINIO_USE_SSL = "true";
        mockFindByTelegramId.mockResolvedValue(mockUserWithTelegram);
        mockCreateReport.mockResolvedValue(mockReport);
        
        mockAxiosGet
          .mockResolvedValueOnce(mockTelegramFileResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData })
          .mockResolvedValueOnce(mockTelegramFileResponse)
          .mockResolvedValueOnce({ data: mockTelegramFileData });

        await createReportFromTelegram(mockReportRequest);

        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            photos: expect.arrayContaining([
              expect.objectContaining({
                url: expect.stringMatching(/^https:\/\//),
              }),
            ]),
          })
        );
      });
    });
  });
});