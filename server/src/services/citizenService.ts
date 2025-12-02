import { UserRepository } from "../repositories/UserRepository";
import { CitizenPhotoRepository } from "../repositories/CitizenPhotoRepository";
import { CitizenPhoto } from "../entities/CitizenPhoto";
import { NotFoundError } from "../utils/errors";
import { toCitizenProfileDTO, type CitizenProfileDTO } from "../interfaces/CitizenDTO";

const userRepository = new UserRepository();
const citizenPhotoRepository = new CitizenPhotoRepository();

export async function getCitizenById(userId: number): Promise<CitizenProfileDTO> {
  const user = await userRepository.findWithPhoto(userId);

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
  const updateData: any = {};
  if (data.firstName) updateData.first_name = data.firstName;
  if (data.lastName) updateData.last_name = data.lastName;
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.password = data.password;
  if (data.salt) updateData.salt = data.salt;
  if (data.telegramUsername !== undefined) updateData.telegram_username = data.telegramUsername;
  if (data.emailNotificationsEnabled !== undefined) updateData.email_notifications_enabled = data.emailNotificationsEnabled;

  const updatedUser = await userRepository.update(userId, updateData);
  return toCitizenProfileDTO(updatedUser!);
}

export async function uploadCitizenPhoto(
  userId: number,
  photoUrl: string,
  filename: string
): Promise<{ url: string; filename: string }> {
  // Check if user already has a photo
  const existingPhoto = await citizenPhotoRepository.findByUserId(userId);

  if (existingPhoto) {
    // Update existing photo
    const updated = await citizenPhotoRepository.updateByUserId(userId, { url: photoUrl, filename });
    return { url: updated!.url, filename: updated!.filename };
  } else {
    // Create new photo
    const created = await citizenPhotoRepository.create({
      userId,
      url: photoUrl,
      filename,
    });
    return { url: created.url, filename: created.filename };
  }
}

export async function deleteCitizenPhoto(userId: number): Promise<void> {
  const photo = await citizenPhotoRepository.findByUserId(userId);

  if (!photo) {
    throw new NotFoundError("Photo not found");
  }

  await citizenPhotoRepository.deleteByUserId(userId);
}

export async function getCitizenPhoto(userId: number): Promise<CitizenPhoto | null> {
  return await citizenPhotoRepository.findByUserId(userId);
}
