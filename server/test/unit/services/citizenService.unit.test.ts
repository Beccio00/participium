import {
  getCitizenById,
  updateCitizenProfile,
  uploadCitizenPhoto,
  deleteCitizenPhoto,
  getCitizenPhoto,
} from "../../../src/services/citizenService";
import { NotFoundError } from "../../../src/utils/errors";
import { prisma } from "../../../src/utils/prismaClient";
import * as CitizenDTO from "../../../src/interfaces/CitizenDTO";

// Mock the prisma utility
jest.mock("../../../src/utils/prismaClient", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    citizenPhoto: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Access mocks via import
const mockFindUniqueUser = prisma.user.findUnique as jest.Mock;
const mockUpdateUser = prisma.user.update as jest.Mock;
const mockFindUniquePhoto = prisma.citizenPhoto.findUnique as jest.Mock;
const mockCreatePhoto = prisma.citizenPhoto.create as jest.Mock;
const mockUpdatePhoto = prisma.citizenPhoto.update as jest.Mock;
const mockDeletePhoto = prisma.citizenPhoto.delete as jest.Mock;

describe("citizenService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCitizenById", () => {
    it("should throw NotFoundError if user not found", async () => {
      mockFindUniqueUser.mockResolvedValue(null);
      await expect(getCitizenById(99)).rejects.toThrow(NotFoundError);
    });

    it("should return citizen profile if found", async () => {
      const mockUser = {
        id: 1,
        first_name: "A",
        last_name: "B",
        email: "a@b.com",
      };
      mockFindUniqueUser.mockResolvedValue(mockUser);
      const spy = jest.spyOn(CitizenDTO, "toCitizenProfileDTO");

      await getCitizenById(1);
      expect(spy).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("updateCitizenProfile", () => {
    it("should update specific fields", async () => {
      const updateData = { firstName: "New", emailNotificationsEnabled: false };
      mockUpdateUser.mockResolvedValue({ id: 1, first_name: "New" });

      await updateCitizenProfile(1, updateData);

      expect(mockUpdateUser).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          first_name: "New",
          email_notifications_enabled: false,
        }),
        include: { photo: true },
      });
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
      mockUpdateUser.mockResolvedValue({});
      await updateCitizenProfile(1, fullData);
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            first_name: "F",
            last_name: "L",
            email: "e",
            password: "p",
            salt: "s",
            telegram_username: "t",
            email_notifications_enabled: true,
          },
        })
      );
    });
  });

  describe("uploadCitizenPhoto", () => {
    it("should create new photo if none exists", async () => {
      // First call (findUnique) returns null
      mockFindUniquePhoto.mockResolvedValueOnce(null);
      mockCreatePhoto.mockResolvedValue({ url: "u", filename: "f" });

      const res = await uploadCitizenPhoto(1, "u", "f");

      expect(mockCreatePhoto).toHaveBeenCalled();
      expect(mockUpdatePhoto).not.toHaveBeenCalled();
      expect(res).toEqual({ url: "u", filename: "f" });
    });

    it("should update existing photo if one exists", async () => {
      // First call returns existing
      mockFindUniquePhoto.mockResolvedValueOnce({ id: 10 });
      mockUpdatePhoto.mockResolvedValue({ url: "u2", filename: "f2" });

      const res = await uploadCitizenPhoto(1, "u2", "f2");

      expect(mockUpdatePhoto).toHaveBeenCalled();
      expect(mockCreatePhoto).not.toHaveBeenCalled();
      expect(res).toEqual({ url: "u2", filename: "f2" });
    });
  });

  describe("deleteCitizenPhoto", () => {
    it("should throw NotFoundError if photo not found", async () => {
      mockFindUniquePhoto.mockResolvedValue(null);
      await expect(deleteCitizenPhoto(1)).rejects.toThrow(NotFoundError);
    });

    it("should delete photo if found", async () => {
      mockFindUniquePhoto.mockResolvedValue({ id: 10 });
      await deleteCitizenPhoto(1);
      expect(mockDeletePhoto).toHaveBeenCalledWith({ where: { userId: 1 } });
    });
  });

  describe("getCitizenPhoto", () => {
    it("should return the photo", async () => {
      const photo = { url: "test" };
      mockFindUniquePhoto.mockResolvedValue(photo);
      const res = await getCitizenPhoto(1);
      expect(res).toBe(photo);
    });
  });
});