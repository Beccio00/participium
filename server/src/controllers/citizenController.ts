import { Request, Response } from 'express';
import { createUser, findByEmail } from '../services/userService';
import { hashPassword } from '../services/passwordService';
import { toUserDTO, Role, isValidRole } from '../interfaces/UserDTO';
import { BadRequestError, ConflictError } from '../utils';

export function signup(role: Role) {
  return async function (req: Request, res: Response): Promise<void> {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !password) {
      const missedFields = [];
      if (!firstName) missedFields.push('firstName');
      if (!lastName) missedFields.push('lastName');
      if (!email) missedFields.push('email');
      if (!password) missedFields.push('password');
      throw new BadRequestError(`Missing required fields: ${missedFields.join(', ')}`);
    }

    if (!isValidRole(role)) {
      throw new BadRequestError('Invalid role');
    }

    const existing = await findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const { hashedPassword, salt } = await hashPassword(password);

    const created = await createUser({
      email,
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
      salt,
      role: role
    });

    res.status(201).json(toUserDTO(created));
  };
}
