import { Request, Response } from "express";
import { 
  toMunicipalityUserDTO,
  isValidRole,
  MUNICIPALITY_ROLES,
  Role,
} from "../interfaces/UserDTO";
import { 
  createMunicipalityUser, 
  getAllMunicipalityUsers, 
  getMunicipalityUserById, 
  deleteMunicipalityUser,
} from "../services/municipalityUserService";
import { findByEmail } from "../services/userService";
import { hashPassword } from "../services/passwordService";
import { BadRequestError, ConflictError, NotFoundError } from "../utils";

export async function createMunicipalityUserController(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    throw new BadRequestError("Missing required fields: firstName, lastName, email, password, role");
  }

  if (!isValidRole(role) || !MUNICIPALITY_ROLES.includes(role as Role)) {
    throw new BadRequestError("Invalid role. Must be one of the municipality roles");
  }

  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email already in use");
  }

  const { hashedPassword, salt } = await hashPassword(password);

  const newUser = await createMunicipalityUser({
    email,
    first_name: firstName,
    last_name: lastName,
    password: hashedPassword,
    salt,
    role: role as Role
  });

  const responseUser = toMunicipalityUserDTO(newUser);
  res.status(201).json(responseUser);
}

export async function listMunicipalityUsersController(req: Request, res: Response): Promise<void> {
  const users = await getAllMunicipalityUsers();
  const responseUsers = users.map(toMunicipalityUserDTO);
  res.status(200).json(responseUsers);
}

export async function getMunicipalityUserController(req: Request, res: Response): Promise<void> {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    throw new BadRequestError("Invalid user ID format");
  }

  const user = await getMunicipalityUserById(userId);
  
  if (!user) {
    throw new NotFoundError("Municipality user not found");
  }

  const responseUser = toMunicipalityUserDTO(user);
  res.status(200).json(responseUser);
}

export async function deleteMunicipalityUserController(req: Request, res: Response): Promise<void> {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    throw new BadRequestError("Invalid user ID format");
  }

  const deleted = await deleteMunicipalityUser(userId);
  
  if (!deleted) {
    throw new NotFoundError("Municipality user not found");
  }

  res.status(204).send();
}

export async function listRolesController(req: Request, res: Response): Promise<void> {
  res.status(200).json(MUNICIPALITY_ROLES);
}