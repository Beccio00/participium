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
  updateMunicipalityUser, 
  deleteMunicipalityUser,
} from "../services/municipalityUserService";
import { findByEmail } from "../services/userService";
import { hashPassword } from "../services/passwordService";



export async function createMunicipalityUserController(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Missing required fields: firstName, lastName, email, password, role"
      });
    }

    // Validate role
    if (!isValidRole(role) || !MUNICIPALITY_ROLES.includes(role as Role)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid role. Allowed: PUBLIC_RELATIONS, ADMINISTRATOR, TECHNICAL_OFFICE"
      });
    }

    // Check if email already exists (in all users)
    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "Conflict",
        message: "Email already in use"
      });
    }

    // Hash password
    const { hashedPassword, salt } = await hashPassword(password);

    // Create municipality user
    const newUser = await createMunicipalityUser({
      email,
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
      salt,
      role: role as Role
    });

    const responseUser = toMunicipalityUserDTO(newUser);
    
    return res.status(201).json(responseUser);

  } catch (error) {
    console.error("Error creating municipality user:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to create municipality user"
    });
  }
}

export async function listMunicipalityUsersController(req: Request, res: Response) {
  try {
    const users = await getAllMunicipalityUsers();
    const responseUsers = users.map(toMunicipalityUserDTO);
    
    return res.status(200).json(responseUsers);

  } catch (error) {
    console.error("Error listing municipality users:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve users"
    });
  }
}

export async function getMunicipalityUserController(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid user ID format"
      });
    }

    const user = await getMunicipalityUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: "NotFound",
        message: "Municipality user not found"
      });
    }

    const responseUser = toMunicipalityUserDTO(user);
    return res.status(200).json(responseUser);

  } catch (error) {
    console.error("Error getting municipality user:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve user"
    });
  }
}

export async function updateMunicipalityUserController(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { firstName, lastName, email, password, role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid user ID format"
      });
    }

    // Require at least one updatable field
    if (!firstName && !lastName && !email && !password && !role) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Provide at least one field to update: firstName, lastName, email, password, or role"
      });
    }

    // Validate role only if provided
    if (role && (!isValidRole(role) || !MUNICIPALITY_ROLES.includes(role as Role))) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid role. Allowed: PUBLIC_RELATIONS, ADMINISTRATOR, TECHNICAL_OFFICE"
      });
    }

    // Check if user exists and is a municipality user
    const existingUser = await getMunicipalityUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: "NotFound",
        message: "Municipality user not found"
      });
    }

    // Check if email is already in use by another user (only if provided and changed)
    if (email && email !== existingUser.email) {
      const emailInUse = await findByEmail(email);
      if (emailInUse) {
        return res.status(409).json({
          error: "Conflict",
          message: "Email already in use"
        });
      }
    }

    // Hash password only if provided
    let hashedPassword: string | undefined = undefined;
    let salt: string | undefined = undefined;
    if (password) {
      const hashed = await hashPassword(password);
      hashedPassword = hashed.hashedPassword;
      salt = hashed.salt;
    }

    // Build update payload with only provided fields
    const updatePayload: any = {
      ...(email && { email }),
      ...(firstName && { first_name: firstName }),
      ...(lastName && { last_name: lastName }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(salt && { salt }),
      ...(role && { role: role as Role }),
    };

    // Update municipality user
    const updatedUser = await updateMunicipalityUser(userId, updatePayload);

    if (!updatedUser) {
      return res.status(404).json({
        error: "NotFound",
        message: "Municipality user not found"
      });
    }

    const responseUser = toMunicipalityUserDTO(updatedUser);
    return res.status(200).json(responseUser);

  } catch (error) {
    console.error("Error updating municipality user:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update user"
    });
  }
}

export async function deleteMunicipalityUserController(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid user ID format"
      });
    }

    const deleted = await deleteMunicipalityUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        error: "NotFound",
        message: "Municipality user not found"
      });
    }

    return res.status(204).send();

  } catch (error) {
    console.error("Error deleting municipality user:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Failed to delete user"
    });
  }
}