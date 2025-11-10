import type { User as PrismaUser } from "../../prisma/generated/client";
import { prisma } from "../index";

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
  role?: string;
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
      role: data.role as any,
      telegram_username: data.telegram_username ?? null,
      email_notifications_enabled: data.email_notifications_enabled ?? undefined,
    },
  });
  return created;
}