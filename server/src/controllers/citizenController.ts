import { Request, Response } from 'express';
import path from 'path';
import { createUser, findByEmail } from '../services/userService';
import { hashPassword } from '../services/passwordService';
import { toUserDTO, Role, isValidRole } from '../interfaces/UserDTO';
import { BadRequestError, ConflictError, NotFoundError } from '../utils';
import {
  getCitizenById,
  updateCitizenProfile as updateCitizenProfileService,
  uploadCitizenPhoto as uploadCitizenPhotoService,
  deleteCitizenPhoto as deleteCitizenPhotoService,
  getCitizenPhoto,
} from '../services/citizenService';
import minioClient, { BUCKET_NAME, getMinioObjectUrl } from '../utils/minioClient';
import { verifyCitizenEmail, sendCitizenVerification } from '../services/citizenService';
import type { CitizenConfigRequestDTO, PhotoUploadResponseDTO } from '../interfaces/CitizenDTO';

export function signup(role: Role) {
  return async function (req: Request, res: Response): Promise<void> {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !password) {
      const missedFields = [];
      if (!firstName) missedFields.push('firstName');
      if (!lastName) missedFields.push('lastName');
      if (!email) missedFields.push('email');
      if (!password) missedFields.push('password');
      throw new BadRequestError(`Missing required fields: ${missedFields.join(', ')}`);
    }

    if (!isValidRole(role)) {
      throw new BadRequestError('Invalid role');
    }

    const existing = await findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const { hashedPassword, salt } = await hashPassword(password);

    const created = await createUser({
      email,
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
      salt,
      role: role,
      telegram_username: null,
      email_notifications_enabled: true
    });

    await sendCitizenVerification(email);

    res.status(201).json(toUserDTO(created));
  };
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body;

  const result = await verifyCitizenEmail(email, code);

  if (result.alreadyVerified) {
    res.status(200).json({ message: "Email already verified" });
    return;
  }

  res.status(200).json({ message: "Email verified successfully" });
  return;
}

export async function resendVerificationEmail(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  
  await sendCitizenVerification(email);
  res.status(200).json({ message: "Verification email sent successfully" });
}

export async function getCitizenProfile(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const profile = await getCitizenById(user.id);
  res.status(200).json(profile);
}

export async function updateCitizenProfile(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const { firstName, lastName, email, password, telegramUsername, emailNotificationsEnabled } = req.body as CitizenConfigRequestDTO;

  // Almeno un campo deve essere presente
  if (
    firstName === undefined &&
    lastName === undefined &&
    email === undefined &&
    password === undefined &&
    telegramUsername === undefined &&
    emailNotificationsEnabled === undefined
  ) {
    throw new BadRequestError('At least one field must be provided');
  }

  let hashedPassword: string | undefined;
  let salt: string | undefined;

  // Se l'utente vuole cambiare email, controlla che non sia già usata da un altro
  if (email) {
    const existing = await findByEmail(email);
    if (existing && existing.id !== user.id) {
      throw new ConflictError('Email already in use');
    }
  }

  if (password) {
    const hashed = await hashPassword(password);
    hashedPassword = hashed.hashedPassword;
    salt = hashed.salt;
  }

  const updatedProfile = await updateCitizenProfileService(user.id, {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    salt,
    telegramUsername,
    emailNotificationsEnabled,
  });

  res.status(200).json(updatedProfile);
}

export async function uploadCitizenPhoto(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const photos = req.files as Express.Multer.File[];

  if (!photos || photos.length === 0) {
    throw new BadRequestError('Photo file is required');
  }

  if (photos.length > 1) {
    throw new BadRequestError('Only one photo allowed');
  }

  const photo = photos[0];

  // Delete old photo from MinIO if exists
  const existingPhoto = await getCitizenPhoto(user.id);
  if (existingPhoto) {
    try {
      await minioClient.removeObject(BUCKET_NAME, existingPhoto.filename);
    } catch (error) {
      console.error('Failed to delete old photo from MinIO:', error);
    }
  }

  // Upload new photo to MinIO
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `citizen-${user.id}-${uniqueSuffix}${path.extname(photo.originalname)}`;

  await minioClient.putObject(BUCKET_NAME, filename, photo.buffer, photo.size, {
    'Content-Type': photo.mimetype,
  });

  const url = getMinioObjectUrl(filename);

  // Save to database
  const savedPhoto = await uploadCitizenPhotoService(user.id, url, filename);

  const response: PhotoUploadResponseDTO = {
    message: 'Photo uploaded successfully',
    photo: {
      id: 0,
      url: savedPhoto.url,
      filename: savedPhoto.filename,
    },
  };

  res.status(201).json(response);
}

export async function deleteCitizenPhoto(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };

  const photo = await getCitizenPhoto(user.id);
  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  try {
    await minioClient.removeObject(BUCKET_NAME, photo.filename);
  } catch (error) {
    console.error('Failed to delete photo from MinIO:', error);
  }

  await deleteCitizenPhotoService(user.id);

  res.status(204).send();
}
