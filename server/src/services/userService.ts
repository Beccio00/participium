import { PrivateUser } from "../interfaces/User";
import { PrismaClient } from "../../prisma/generated/client";

const prisma = new PrismaClient();

// Find user by email (username in previous code). Returns PrivateUser or null.
export async function findByEmail(email: string): Promise<PrivateUser | null> {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return null;
  return new PrivateUser(u.id, u.email, u.first_name, u.last_name, u.password, u.salt, u.role);
}

export async function findById(id: number): Promise<PrivateUser | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return null;
  return new PrivateUser(u.id, u.email, u.first_name, u.last_name, u.password, u.salt, u.role);
}

export default { findByEmail, findById };