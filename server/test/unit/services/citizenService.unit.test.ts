import { NotFoundError } from "../../../src/utils/errors";
import * as CitizenDTO from "../../../src/interfaces/CitizenDTO";

// Create mock functions for repositories
const mockFindWithPhoto = jest.fn();
const mockFindByEmail = jest.fn();
const mockUpdate = jest.fn();
const mockFindByUserId = jest.fn();
const mockCreate = jest.fn();
const mockUpdateByUserId = jest.fn();
const mockDeleteByUserId = jest.fn();

// Mock UserRepository BEFORE imports
jest.mock("../../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      findWithPhoto: mockFindWithPhoto,
      findByEmail: mockFindByEmail,
      update: mockUpdate,
    })),
  };
});

// Mock CitizenPhotoRepository BEFORE imports
jest.mock("../../../src/repositories/CitizenPhotoRepository", () => {
  return {
    CitizenPhotoRepository: jest.fn().mockImplementation(() => ({
      findByUserId: mockFindByUserId,
      create: mockCreate,
      updateByUserId: mockUpdateByUserId,
      deleteByUserId: mockDeleteByUserId,
    })),
  };
});

// Mock UserRepository.findByEmail and emailService for verification flows
jest.mock('../../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn(),
}));

// Import services after mocks
import {
  getCitizenById,
  updateCitizenProfile,
  uploadCitizenPhoto,
  deleteCitizenPhoto,
  getCitizenPhoto,
  sendCitizenVerification,
  verifyCitizenEmail,
} from "../../../src/services/citizenService";

describe('citizen verification flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendCitizenVerification updates user token and calls emailService', async () => {
    const dummyUser = { id: 1, email: 'u@example.com', role: 'CITIZEN', isVerified: false } as any;
    mockFindByEmail.mockResolvedValue(dummyUser);
    mockUpdate.mockResolvedValue({});

    await sendCitizenVerification('u@example.com');

    expect(mockFindByEmail).toHaveBeenCalledWith('u@example.com');
    expect(mockUpdate).toHaveBeenCalledWith(dummyUser.id, expect.objectContaining({ verificationToken: expect.any(String) }));
  });

  it('sendCitizenVerification throws BadRequestError when email sending fails', async () => {
    const dummyUser = { id: 9, email: 'fail@example.com', role: 'CITIZEN', isVerified: false } as any;
    mockFindByEmail.mockResolvedValue(dummyUser);
    mockUpdate.mockResolvedValue({});
    const emailService = require('../../../src/services/emailService');
    emailService.sendVerificationEmail.mockRejectedValue(new Error('boom'));

    await expect(sendCitizenVerification('fail@example.com')).rejects.toThrow('Failed to send verification email');
  });

  it('sendCitizenVerification throws if user not found or role invalid or already verified', async () => {
    mockFindByEmail.mockResolvedValue(null);
    await expect(sendCitizenVerification('missing@example.com')).rejects.toThrow();

    mockFindByEmail.mockResolvedValue({ id: 2, email: 'a', role: 'PUBLIC_RELATIONS', isVerified: false } as any);
    await expect(sendCitizenVerification('a')).rejects.toThrow();

    mockFindByEmail.mockResolvedValue({ id: 3, email: 'b', role: 'CITIZEN', isVerified: true } as any);
    await expect(sendCitizenVerification('b')).rejects.toThrow();
  });

  it('verifyCitizenEmail accepts valid code and marks user verified', async () => {
    const token = '123456';
    const future = new Date(Date.now() + 1000000);
    mockFindByEmail.mockResolvedValue({ id: 4, email: 'v@example.com', role: 'CITIZEN', isVerified: false, verificationToken: token, verificationCodeExpiresAt: future } as any);
    mockUpdate.mockResolvedValue({});

    const res = await verifyCitizenEmail('v@example.com', token);
    expect(res).toEqual({ alreadyVerified: false });
    expect(mockUpdate).toHaveBeenCalledWith(4, expect.objectContaining({ isVerified: true }));
  });

  it('verifyCitizenEmail returns alreadyVerified when appropriate and throws on invalid code/expired', async () => {
    mockFindByEmail.mockResolvedValue({ id: 5, email: 'x@example.com', role: 'CITIZEN', isVerified: true } as any);
    const res = await verifyCitizenEmail('x@example.com', 'whatever');
    expect(res).toEqual({ alreadyVerified: true });

    const past = new Date(Date.now() - 10000);
    mockFindByEmail.mockResolvedValue({ id: 6, email: 'y@example.com', role: 'CITIZEN', isVerified: false, verificationToken: 't', verificationCodeExpiresAt: past } as any);
    await expect(verifyCitizenEmail('y@example.com', 't')).rejects.toThrow();

    const future = new Date(Date.now() + 1000000);
    mockFindByEmail.mockResolvedValue({ id: 7, email: 'z@example.com', role: 'CITIZEN', isVerified: false, verificationToken: 't2', verificationCodeExpiresAt: future } as any);
    await expect(verifyCitizenEmail('z@example.com', 'wrong')).rejects.toThrow();
  });
});

describe("citizenService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCitizenById", () => {
    it("should throw NotFoundError if user not found", async () => {
      mockFindWithPhoto.mockResolvedValue(null);
      await expect(getCitizenById(99)).rejects.toThrow(NotFoundError);
    });

    it("should return citizen profile if found", async () => {
      const mockUser = {
        id: 1,
        first_name: "A",
        last_name: "B",
        email: "a@b.com",
        role: "CITIZEN",
        telegram_username: null,
        email_notifications_enabled: true,
        photo: null,
      };
      mockFindWithPhoto.mockResolvedValue(mockUser);
      const spy = jest.spyOn(CitizenDTO, "toCitizenProfileDTO");

      await getCitizenById(1);
      expect(spy).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("updateCitizenProfile", () => {
    it("should update specific fields", async () => {
      const updateData = { firstName: "New", emailNotificationsEnabled: false };
      mockUpdate.mockResolvedValue({ id: 1, first_name: "New" });

      await updateCitizenProfile(1, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        first_name: "New",
        email_notifications_enabled: false,
      }));
    });

    it("should handle all optional fields", async () => {
      const fullData = {
        firstName: "F",
        lastName: "L",
        email: "e",
        password: "p",
        salt: "s",
        emailNotificationsEnabled: true,
      };
      mockUpdate.mockResolvedValue({});
      await updateCitizenProfile(1, fullData);
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        first_name: "F",
        last_name: "L",
        email: "e",
        password: "p",
        salt: "s",
        email_notifications_enabled: true,
      });
    });
  });

  describe("uploadCitizenPhoto", () => {
    it("should create new photo if none exists", async () => {
      mockFindByUserId.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ url: "u", filename: "f" });

      const res = await uploadCitizenPhoto(1, "u", "f");

      expect(mockCreate).toHaveBeenCalled();
      expect(mockUpdateByUserId).not.toHaveBeenCalled();
      expect(res).toEqual({ url: "u", filename: "f" });
    });

    it("should update existing photo if one exists", async () => {
      mockFindByUserId.mockResolvedValue({ id: 10 });
      mockUpdateByUserId.mockResolvedValue({ url: "u2", filename: "f2" });

      const res = await uploadCitizenPhoto(1, "u2", "f2");

      expect(mockUpdateByUserId).toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(res).toEqual({ url: "u2", filename: "f2" });
    });
  });

  describe("deleteCitizenPhoto", () => {
    it("should throw NotFoundError if photo not found", async () => {
      mockFindByUserId.mockResolvedValue(null);
      await expect(deleteCitizenPhoto(1)).rejects.toThrow(NotFoundError);
    });

    it("should delete photo if found", async () => {
      mockFindByUserId.mockResolvedValue({ id: 10 });
      await deleteCitizenPhoto(1);
      expect(mockDeleteByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("getCitizenPhoto", () => {
    it("should return the photo", async () => {
      const photo = { url: "test", filename: "test.jpg" };
      mockFindByUserId.mockResolvedValue(photo);
      const res = await getCitizenPhoto(1);
      expect(res).toBe(photo);
    });

    it("should return null if no photo exists", async () => {
      mockFindByUserId.mockResolvedValue(null);
      const res = await getCitizenPhoto(1);
      expect(res).toBeNull();
    });
  });
});
