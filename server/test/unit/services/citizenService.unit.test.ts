import { NotFoundError } from "../../../src/utils/errors";
import * as CitizenDTO from "../../../src/interfaces/CitizenDTO";

// Create mock functions for repositories
const mockFindWithPhoto = jest.fn();
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

// Import services after mocks
import {
  getCitizenById,
  updateCitizenProfile,
  uploadCitizenPhoto,
  deleteCitizenPhoto,
  getCitizenPhoto,
} from "../../../src/services/citizenService";

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
        telegramUsername: "t",
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
        telegram_username: "t",
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
