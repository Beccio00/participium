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
import { updateMunicipalityUser } from "../services/municipalityUserService";

export async function createMunicipalityUserController(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role || !Array.isArray(role) || role.length === 0) {
    throw new BadRequestError("Missing required fields: firstName, lastName, email, password, role (must be a non-empty array)");
  }

  // Verifica che tutti i ruoli siano validi
  for (const r of role) {
    if (!isValidRole(r) || !MUNICIPALITY_ROLES.includes(r as Role)) {
      throw new BadRequestError("Invalid role. Must be one of the municipality roles");
    }
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
    role: role.map((r: string) => r as Role),
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

export async function updateMunicipalityUserController(req: Request, res: Response): Promise<void> {
  const userId = parseInt(req.params.userId);
  const { firstName, lastName, email, password, roles } = req.body; // Aggiunto roles

  if (isNaN(userId)) {
    throw new BadRequestError("Invalid user ID format");
  }

  // Almeno un campo deve essere fornito
  if (!firstName && !lastName && !email && !password && (!roles || !Array.isArray(roles))) {
    throw new BadRequestError("At least one field must be provided: firstName, lastName, email, password, roles");
  }

  const updateData: any = {};
  
  // Gestisci dati base
  if (firstName) updateData.first_name = firstName;
  if (lastName) updateData.last_name = lastName;
  if (email) updateData.email = email;
  
  // Gestisci password
  if (password) {
    const { hashedPassword, salt } = await hashPassword(password);
    updateData.password = hashedPassword;
    updateData.salt = salt;
  }

  // Gestisci ruoli
  if (roles && Array.isArray(roles)) {
    if (roles.length === 0) {
      throw new BadRequestError("Roles array cannot be empty");
    }
    
    // Valida tutti i ruoli
    for (const r of roles) {
      if (!isValidRole(r) || !MUNICIPALITY_ROLES.includes(r as Role)) {
        throw new BadRequestError("Invalid role. Must be one of the municipality roles");
      }
    }
    
    updateData.role = roles.map((r: string) => r as Role);
  }

  // Controlla email duplicata se viene aggiornata
  if (email) {
    const existingUser = await findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError("Email already in use");
    }
  }

  const updated = await updateMunicipalityUser(userId, updateData);
  
  if (!updated) {
    throw new NotFoundError("Municipality user not found");
  }

  res.status(200).json(toMunicipalityUserDTO(updated));
}