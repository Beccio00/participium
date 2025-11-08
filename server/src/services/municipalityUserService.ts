import type { User as PrismaUser } from "../../prisma/generated/client";
import { PrismaClient } from "../../prisma/generated/client";

const prisma = new PrismaClient();

export async function createMunicipalityUser(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  salt: string;
  role: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
}): Promise<PrismaUser> {
  const created = await prisma.user.create({
    data: {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      salt: data.salt,
      role: data.role as any,
      telegram_username: null,
      email_notifications_enabled: true,
    },
  });
  return created;
}

export async function getAllMunicipalityUsers(): Promise<PrismaUser[]> {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['PUBLIC_RELATIONS', 'ADMINISTRATOR', 'TECHNICAL_OFFICE']
      }
    }
  });
  return users;
}

export async function getMunicipalityUserById(id: number): Promise<PrismaUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { id: id },
        {
          role: {
            in: ['PUBLIC_RELATIONS', 'ADMINISTRATOR', 'TECHNICAL_OFFICE']
          }
        }
      ]
    }
  });
  return user;
}

export async function updateMunicipalityUser(id: number, data: {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  salt?: string;
  role?: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
}): Promise<PrismaUser | null> {
  // First check if user exists and is a municipality user
  const existingUser = await getMunicipalityUserById(id);
  if (!existingUser) {
    return null;
  }

  const updated = await prisma.user.update({
    where: { id: id },
    data: {
      ...(data.email && { email: data.email }),
      ...(data.first_name && { first_name: data.first_name }),
      ...(data.last_name && { last_name: data.last_name }),
      ...(data.password && { password: data.password }),
      ...(data.salt && { salt: data.salt }),
      ...(data.role && { role: data.role as any }),
    },
  });
  return updated;
}

export async function deleteMunicipalityUser(id: number): Promise<boolean> {
  try {
    // First check if user exists and is a municipality user
    const existingUser = await getMunicipalityUserById(id);
    if (!existingUser) {
      return false;
    }

    await prisma.user.delete({
      where: { id: id }
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function findMunicipalityUserByEmail(email: string): Promise<PrismaUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { email: email },
        {
          role: {
            in: ['PUBLIC_RELATIONS', 'ADMINISTRATOR', 'TECHNICAL_OFFICE']
          }
        }
      ]
    }
  });
  return user;
}