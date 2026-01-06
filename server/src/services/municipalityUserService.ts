import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";
import { Role } from "../../../shared/RoleTypes";
import {
  createUser,
  findByEmail,
  findById,
  updateUser,
  deleteUser,
  findUsersByRoles,
} from "./userService";
import { MUNICIPALITY_ROLES } from "../interfaces/UserDTO";
import { BadRequestError } from "../utils";

const userRepository = new UserRepository();

//helper function for roles

const getRolesAsArray = (roleData:any): Role[] =>{
  if(Array.isArray(roleData)){
    return roleData as Role[];
  }
  return [roleData as Role];
}

export async function createMunicipalityUser(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  salt: string;
  role: Role[];
}): Promise<User> {
  const created = await createUser({
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    password: data.password,
    salt: data.salt,
    role: getRolesAsArray(data.role),
    telegram_username: null,
    email_notifications_enabled: true,
  });
  
  const verified = await userRepository.update(created.id, {
    isVerified: true
  });
  
  return verified || created;
}

export async function getAllMunicipalityUsers(): Promise<User[]> {
  return await findUsersByRoles(MUNICIPALITY_ROLES);
}

export async function getMunicipalityUserById(id: number): Promise<User | null> {
  const user = await findById(id);
  if (!user) return null;
  if (!MUNICIPALITY_ROLES.some(role => getRolesAsArray(user.role).includes(role))) return null;
  return user;
}

export async function updateMunicipalityUser(id: number, data: {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  salt?: string;
  role?: Role[];
}): Promise<User | null> {
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
  const users = await userRepository.findByRoles([Role.ADMINISTRATOR]);
  return users.length;
}

export async function deleteMunicipalityUser(id: number): Promise<boolean> {
  const existing = await getMunicipalityUserById(id);
  if (!existing) return false;

  if (existing.role.includes(Role.ADMINISTRATOR)) {
    const adminCount = await countAdministrators();
    if (adminCount <= 1) {
      throw new BadRequestError("Cannot delete the last administrator account");
    }
  }

  return await deleteUser(id);
}

export async function findMunicipalityUserByEmail(email: string): Promise<User | null> {
  const user = await findByEmail(email);
  if (!user) return null;
  if (!MUNICIPALITY_ROLES.some(role => getRolesAsArray(user.role).includes(role))) return null;
  return user;
}