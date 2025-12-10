import { Request, Response } from "express";
import {
  getCitizenProfile,
  signup,
  updateCitizenProfile,
  uploadCitizenPhoto,
  deleteCitizenPhoto,
} from "../../../src/controllers/citizenController";
import { findByEmail, createUser } from "../../../src/services/userService";
import { hashPassword } from "../../../src/services/passwordService";
import * as UserDTO from "../../../src/interfaces/UserDTO";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../src/utils";
import * as citizenService from "../../../src/services/citizenService";
import minioClient from "../../../src/utils/minioClient";

jest.mock("../../../src/utils/minioClient");
jest.mock("../../../src/services/citizenService");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/passwordService");

const mockGetCitizenById = citizenService.getCitizenById as jest.MockedFunction<
  typeof citizenService.getCitizenById
>;
const mockUpdateCitizenProfileService =
  citizenService.updateCitizenProfile as jest.MockedFunction<
    typeof citizenService.updateCitizenProfile
  >;
const mockGetCitizenPhoto =
  citizenService.getCitizenPhoto as jest.MockedFunction<
    typeof citizenService.getCitizenPhoto
  >;
const mockDeleteCitizenPhotoService =
  citizenService.deleteCitizenPhoto as jest.MockedFunction<
    typeof citizenService.deleteCitizenPhoto
  >;
const mockUploadCitizenPhotoService =
  citizenService.uploadCitizenPhoto as jest.MockedFunction<
    typeof citizenService.uploadCitizenPhoto
  >;

const mockFindByEmail = findByEmail as jest.MockedFunction<typeof findByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;

describe("citizenController", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1 }, // Default user context
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.error for tests
  });

  describe("signup", () => {
    const signupHandler = signup(UserDTO.Roles.CITIZEN);

    it("should create user successfully with all fields", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password: "hashed",
        salt: "salt",
        role: require("../../../shared/RoleTypes").Role.CITIZEN,
        telegram_username: null,
        email_notifications_enabled: true,
        // TypeORM 关联字段
        reports: [],
        messages: [],
        assignedReports: [],
        notifications: [],
        photo: null as any,
        isVerified: true,
        verificationToken: null,
        verificationCodeExpiresAt: null,
        externalCompanyId: null,
        externalCompany: null,
      };
      const mockUserDTO = {
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: require("../../../shared/RoleTypes").Role.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true,
        isVerified: true,
      };

      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockCreateUser.mockResolvedValue(mockUser);
      jest.spyOn(UserDTO, "toUserDTO").mockReturnValue(mockUserDTO);

      await signupHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserDTO);
    });

    it("should return error if firstName is missing", async () => {
      mockReq.body = {
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if lastName is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        email: "test@example.com",
        password: "password123",
      };
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if email is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        password: "password123",
      };
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if password is missing", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      };
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if all fields are missing", async () => {
      mockReq.body = {};
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should return error if email already exists", async () => {
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      mockFindByEmail.mockResolvedValue({ id: 2 } as any); // Existing user

      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(ConflictError);
    });

    it("should handle req.body undefined", async () => {
      mockReq.body = undefined;
      await expect(
        signupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle invalid role", async () => {
      const invalidSignupHandler = signup("INVALID_ROLE" as any);
      mockReq.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };
      await expect(
        invalidSignupHandler(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("getCitizenProfile", () => {
    it("should return citizen profile", async () => {
      mockReq.user = { id: 1 };
      const mockProfile = { id: 1, firstName: "Test" };
      mockGetCitizenById.mockResolvedValue(mockProfile as any);

      await getCitizenProfile(mockReq as Request, mockRes as Response);

      expect(mockGetCitizenById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });
  });

  describe("updateCitizenProfile", () => {
    it("should throw error if no fields provided for update", async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {};

      await expect(
        updateCitizenProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should update profile fields successfully", async () => {
      mockReq.body = { firstName: "New", lastName: "Name" };
      const updatedProfile = { id: 1, firstName: "New", lastName: "Name" };
      mockUpdateCitizenProfileService.mockResolvedValue(updatedProfile as any);

      await updateCitizenProfile(mockReq as Request, mockRes as Response);

      expect(mockUpdateCitizenProfileService).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstName: "New",
          lastName: "Name",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedProfile);
    });

    it("should update password correctly", async () => {
      mockReq.body = { password: "newpassword" };
      mockHashPassword.mockResolvedValue({
        hashedPassword: "hashed",
        salt: "salt",
      });
      mockUpdateCitizenProfileService.mockResolvedValue({} as any);

      await updateCitizenProfile(mockReq as Request, mockRes as Response);

      expect(mockHashPassword).toHaveBeenCalledWith("newpassword");
      expect(mockUpdateCitizenProfileService).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          password: "hashed",
          salt: "salt",
        })
      );
    });

    it("should throw conflict error if new email is already taken by another user", async () => {
      mockReq.body = { email: "taken@example.com" };
      mockFindByEmail.mockResolvedValue({ id: 2 } as any); // Different user ID

      await expect(
        updateCitizenProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(ConflictError);
    });

    it("should allow update if email belongs to the same user", async () => {
      mockReq.body = { email: "me@example.com" };
      mockFindByEmail.mockResolvedValue({ id: 1 } as any); // Same user ID
      mockUpdateCitizenProfileService.mockResolvedValue({} as any);

      await updateCitizenProfile(mockReq as Request, mockRes as Response);

      expect(mockUpdateCitizenProfileService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadCitizenPhoto", () => {
    const mockFile = {
      originalname: "test.jpg",
      buffer: Buffer.from("data"),
      size: 100,
      mimetype: "image/jpeg",
    };

    it("should upload photo successfully when no previous photo exists", async () => {
      mockReq.files = [mockFile];
      mockGetCitizenPhoto.mockResolvedValue(null); // No existing photo
      (minioClient.putObject as jest.Mock).mockResolvedValue(true);
      const mockSavedPhoto = {
        url: "http://minio/photo.jpg",
        filename: "photo.jpg",
      };
      mockUploadCitizenPhotoService.mockResolvedValue(mockSavedPhoto as any);

      await uploadCitizenPhoto(mockReq as Request, mockRes as Response);

      expect(minioClient.putObject).toHaveBeenCalled();
      expect(mockUploadCitizenPhotoService).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should delete existing photo before uploading new one", async () => {
      mockReq.files = [mockFile];
      mockGetCitizenPhoto.mockResolvedValue({ filename: "old.jpg" } as any);
      (minioClient.removeObject as jest.Mock).mockResolvedValue(true);
      (minioClient.putObject as jest.Mock).mockResolvedValue(true);
      mockUploadCitizenPhotoService.mockResolvedValue({
        url: "new.jpg",
        filename: "new.jpg",
      } as any);

      await uploadCitizenPhoto(mockReq as Request, mockRes as Response);

      expect(minioClient.removeObject).toHaveBeenCalledWith(
        expect.any(String),
        "old.jpg"
      );
      expect(minioClient.putObject).toHaveBeenCalled();
    });

    it("should handle error when deleting old photo and continue upload", async () => {
      mockReq.files = [mockFile];
      mockGetCitizenPhoto.mockResolvedValue({ filename: "old.jpg" } as any);
      (minioClient.removeObject as jest.Mock).mockRejectedValue(
        new Error("MinIO Error")
      );
      (minioClient.putObject as jest.Mock).mockResolvedValue(true);
      mockUploadCitizenPhotoService.mockResolvedValue({
        url: "new.jpg",
        filename: "new.jpg",
      } as any);

      await uploadCitizenPhoto(mockReq as Request, mockRes as Response);

      expect(minioClient.removeObject).toHaveBeenCalled();
      // Should still proceed to upload
      expect(minioClient.putObject).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should throw error if photo file is missing", async () => {
      mockReq.files = [];
      await expect(
        uploadCitizenPhoto(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if req.files is undefined", async () => {
      mockReq.files = undefined;
      await expect(
        uploadCitizenPhoto(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if multiple photos are uploaded", async () => {
      mockReq.files = [mockFile, mockFile];
      await expect(
        uploadCitizenPhoto(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("deleteCitizenPhoto", () => {
    it("should delete photo successfully", async () => {
      mockReq.user = { id: 1 };
      mockGetCitizenPhoto.mockResolvedValue({ filename: "photo.jpg" } as any);
      (minioClient.removeObject as jest.Mock).mockResolvedValue(true);
      mockDeleteCitizenPhotoService.mockResolvedValue(undefined);

      await deleteCitizenPhoto(mockReq as Request, mockRes as Response);

      expect(minioClient.removeObject).toHaveBeenCalledWith(
        expect.any(String),
        "photo.jpg"
      );
      expect(mockDeleteCitizenPhotoService).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should throw NotFoundError if photo does not exist", async () => {
      mockReq.user = { id: 1 };
      mockGetCitizenPhoto.mockResolvedValue(null);

      await expect(
        deleteCitizenPhoto(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle MinIO deletion error and still delete from DB", async () => {
      mockReq.user = { id: 1 };
      mockGetCitizenPhoto.mockResolvedValue({ filename: "photo.jpg" } as any);
      (minioClient.removeObject as jest.Mock).mockRejectedValue(
        new Error("MinIO Error")
      );
      mockDeleteCitizenPhotoService.mockResolvedValue(undefined);

      await deleteCitizenPhoto(mockReq as Request, mockRes as Response);

      // Verify MinIO remove was attempted
      expect(minioClient.removeObject).toHaveBeenCalled();
      // Verify DB delete was still called
      expect(mockDeleteCitizenPhotoService).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });
    describe("email verification endpoints", () => {
      jest.resetModules();
      const mockVerifyCitizenEmail = jest.fn();
      const mockSendCitizenVerification = jest.fn();

      jest.doMock("../../../src/services/citizenService", () => ({
        verifyCitizenEmail: mockVerifyCitizenEmail,
        sendCitizenVerification: mockSendCitizenVerification,
        // keep other named exports unused in this block
      }));

      const { verifyEmail, resendVerificationEmail } = require("../../../src/controllers/citizenController");

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("verifyEmail returns already verified message", async () => {
        mockVerifyCitizenEmail.mockResolvedValue({ alreadyVerified: true });
        const req: any = { body: { email: "c@example.com", code: "123456" } };
        const json = jest.fn();
        const res: any = { status: jest.fn(() => ({ json })), json };

        await verifyEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ message: "Email already verified" });
      });

      it("verifyEmail returns verified message for fresh verification", async () => {
        mockVerifyCitizenEmail.mockResolvedValue({ alreadyVerified: false });
        const req: any = { body: { email: "c2@example.com", code: "999999" } };
        const json = jest.fn();
        const res: any = { status: jest.fn(() => ({ json })), json };

        await verifyEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ message: "Email verified successfully" });
      });

      it("resendVerificationEmail triggers send and returns success", async () => {
        mockSendCitizenVerification.mockResolvedValue(undefined);
        const req: any = { body: { email: "c@example.com" } };
        const json = jest.fn();
        const res: any = { status: jest.fn(() => ({ json })), json };

        await resendVerificationEmail(req, res);
        expect(mockSendCitizenVerification).toHaveBeenCalledWith("c@example.com");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ message: "Verification email sent successfully" });
      });
    });
});
