import bcrypt from "bcrypt";
import type { User as PrismaUser } from "@prisma/client";

// Genera un hash e un sale della password
export async function hashPassword(plain: string): Promise<{ hashedPassword: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plain, salt);
  return { hashedPassword, salt };
}

// Verifica se la password fornita corrisponde all'hash memorizzato nel db
export async function verifyPassword(dbUser: PrismaUser | null | undefined, password: string): Promise<boolean> {
  if (!dbUser || !(dbUser as any).password) return false;
  return bcrypt.compare(password, (dbUser as any).password);
}
