import { Request, Response } from 'express';
import { createUser, findByEmail } from '../services/userService';
import { hashPassword } from '../services/passwordService';
import { toUserDTO } from '../interfaces/UserDTO';


// FOR THE OTHERS USING THIS FOR NEXT SIGNUP FUNCTIONS:
// for example, if you are making the routes for admins
// in adminRoutes.ts write
// router.post('/register', signup('ADMIN'));


export function signup(role: string) {
  return async function (req: Request, res: Response) {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !password) {
      let missedFields = [];
      if (!firstName) missedFields.push('firstName');
      if (!lastName) missedFields.push('lastName');
      if (!email) missedFields.push('email');
      if (!password) missedFields.push('password');
      return res.status(400).json({ 
          error: 'BadRequest', 
          message: `Missing required fields: ${missedFields.join(', ')}` 
      });
    }

    try {
      const existing = await findByEmail(email);
      if (existing) {
          return res.status(409).json({ 
              error: 'Conflict', 
              message: 'Email already in use' 
          });
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

      return res.status(201).json(toUserDTO(created));
    } catch (err) {
      return res.status(500).json({ 
          error: 'InternalServerError', 
          message: 'Unable to create user' 
      });
    }
  };
}

/*
export async function signup(req: Request, res: Response) {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !password) {
      let missedFields = [];
      if (!firstName) missedFields.push('firstName');
      if (!lastName) missedFields.push('lastName');
      if (!email) missedFields.push('email');
      if (!password) missedFields.push('password');
      return res.status(400).json({ 
          error: 'BadRequest', 
          message: `Missing required fields: ${missedFields.join(', ')}` 
      });
    }

    try {
      const existing = await findByEmail(email);
      if (existing) {
          return res.status(409).json({ 
              error: 'Conflict', 
              message: 'Email already in use' 
          });
      }

      const { hashedPassword, salt } = await hashPassword(password);

      const created = await createUser({
        email,
        first_name: firstName,
        last_name: lastName,
        password: hashedPassword,
        salt,
        role: 'CITIZEN'
      });

      return res.status(201).json(toUserDTO(created));
    } catch (err) {
      return res.status(500).json({ 
          error: 'InternalServerError', 
          message: 'Unable to create user' 
      });
    }
}*/
