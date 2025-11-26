import { prisma } from "../utils/prismaClient";
import { NotFoundError } from "../utils/errors";
import type { CitizenPhoto } from "@prisma/client";
import { toCitizenProfileDTO, type CitizenProfileDTO } from "../interfaces/CitizenDTO";

export async function getCitizenById(userId: number): Promise<CitizenProfileDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { photo: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return toCitizenProfileDTO(user);
}

export async function updateCitizenProfile(
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    salt?: string;
    telegramUsername?: string | null;
    emailNotificationsEnabled?: boolean;
  }
): Promise<CitizenProfileDTO> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { first_name: data.firstName }),
      ...(data.lastName && { last_name: data.lastName }),
      ...(data.email && { email: data.email }),
      ...(data.password && { password: data.password }),
      ...(data.salt && { salt: data.salt }),
      ...(data.telegramUsername !== undefined && { telegram_username: data.telegramUsername }),
      ...(data.emailNotificationsEnabled !== undefined && {
        email_notifications_enabled: data.emailNotificationsEnabled,
      }),
    },
    include: { photo: true },
  });

  return toCitizenProfileDTO(updatedUser);
}

export async function uploadCitizenPhoto(
  userId: number,
  photoUrl: string,
  filename: string
): Promise<{ url: string; filename: string }> {
  // Check if user already has a photo
  const existingPhoto = await prisma.citizenPhoto.findUnique({
    where: { userId },
  });

  if (existingPhoto) {
    // Update existing photo
    const updated = await prisma.citizenPhoto.update({
      where: { userId },
      data: { url: photoUrl, filename },
    });
    return { url: updated.url, filename: updated.filename };
  } else {
    // Create new photo
    const created = await prisma.citizenPhoto.create({
      data: {
        userId,
        url: photoUrl,
        filename,
      },
    });
    return { url: created.url, filename: created.filename };
  }
}

export async function deleteCitizenPhoto(userId: number): Promise<void> {
  const photo = await prisma.citizenPhoto.findUnique({
    where: { userId },
  });

  if (!photo) {
    throw new NotFoundError("Photo not found");
  }

  await prisma.citizenPhoto.delete({
    where: { userId },
  });
}

export async function getCitizenPhoto(userId: number): Promise<CitizenPhoto | null> {
  return await prisma.citizenPhoto.findUnique({
    where: { userId },
  });
}
