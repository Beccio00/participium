import type { User as PrismaUser } from "../../prisma/generated/client";
import { PrismaClient } from "../../prisma/generated/client";
import { Role } from "../interfaces/UserDTO";

const prisma = new PrismaClient();

export async function findByEmail(email: string): Promise<PrismaUser | null> {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return null;
  return u;
}

export async function findById(id: number): Promise<PrismaUser | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return null;
  return u;
}

export async function createUser(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  salt: string;
  role: Role;
  telegram_username?: string | null;
  email_notifications_enabled?: boolean;
}): Promise<PrismaUser> {
  const created = await prisma.user.create({
    data: {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      salt: data.salt,
      role: data.role,
      telegram_username: data.telegram_username ?? null,
      email_notifications_enabled:
        data.email_notifications_enabled ?? undefined,
    },
  });
  return created;
}

export async function updateUser(id: number, data: {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  salt?: string;
  role?: Role;
  telegram_username?: string | null;
  email_notifications_enabled?: boolean;
}): Promise<PrismaUser | null> {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.first_name && { first_name: data.first_name }),
        ...(data.last_name && { last_name: data.last_name }),
        ...(data.password && { password: data.password }),
        ...(data.salt && { salt: data.salt }),
        ...(data.role && { role: data.role }),
        ...(data.telegram_username !== undefined && { telegram_username: data.telegram_username }),
        ...(data.email_notifications_enabled !== undefined && { email_notifications_enabled: data.email_notifications_enabled }),
      },
    });
    return updated;
  } catch (err) {
    return null;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch (err) {
    return false;
  }
}

export async function findUsersByRoles(roles: Role[]): Promise<PrismaUser[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles as any }
    }
  });
  return users;
}

