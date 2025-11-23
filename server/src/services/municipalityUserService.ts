import type { User as PrismaUser } from "@prisma/client";
import {
  createUser,
  findByEmail,
  findById,
  updateUser,
  deleteUser,
  findUsersByRoles,
} from "./userService";
import { Role, MUNICIPALITY_ROLES } from "../interfaces/UserDTO";
import { PrismaClient } from "@prisma/client";
import { BadRequestError } from "../utils";

const prisma = new PrismaClient();

export async function createMunicipalityUser(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  salt: string;
  role: Role;
}): Promise<PrismaUser> {
  const created = await createUser({
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    password: data.password,
    salt: data.salt,
    role: data.role,
    telegram_username: null,
    email_notifications_enabled: true,
  });
  return created;
}

export async function getAllMunicipalityUsers(): Promise<PrismaUser[]> {
  return await findUsersByRoles(MUNICIPALITY_ROLES);
}

export async function getMunicipalityUserById(id: number): Promise<PrismaUser | null> {
  const user = await findById(id);
  if (!user) return null;
  if (!MUNICIPALITY_ROLES.includes(user.role as Role)) return null;
  return user;
}

export async function updateMunicipalityUser(id: number, data: {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  salt?: string;
  role?: Role;
}): Promise<PrismaUser | null> {
  const existing = await getMunicipalityUserById(id);
  if (!existing) return null;

  const updated = await updateUser(id, {
    ...(data.email && { email: data.email }),
    ...(data.first_name && { first_name: data.first_name }),
    ...(data.last_name && { last_name: data.last_name }),
    ...(data.password && { password: data.password }),
    ...(data.salt && { salt: data.salt }),
    ...(data.role && { role: data.role }),
  });

  return updated;
}

async function countAdministrators(): Promise<number> {
  const count = await prisma.user.count({
    where: { role: "ADMINISTRATOR" }
  });
  return count;
}

export async function deleteMunicipalityUser(id: number): Promise<boolean> {
  const existing = await getMunicipalityUserById(id);
  if (!existing) return false;

  if (existing.role === "ADMINISTRATOR") {
    const adminCount = await countAdministrators();
    if (adminCount <= 1) {
      throw new BadRequestError("Cannot delete the last administrator account");
    }
  }

  return await deleteUser(id);
}

export async function findMunicipalityUserByEmail(email: string): Promise<PrismaUser | null> {
  const user = await findByEmail(email);
  if (!user) return null;
  if (!MUNICIPALITY_ROLES.includes(user.role as Role)) return null;
  return user;
}