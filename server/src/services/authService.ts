import passport from "passport";
import type { UserDTO } from "../interfaces/UserDTO";
import { Request } from "express";
import { UnauthorizedError } from "../utils";

export async function authenticate(req: Request): Promise<UserDTO> {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (err: Error | null, user?: UserDTO | false) => {
      if (err) return reject(err);
      if (!user) return reject(new UnauthorizedError("Invalid username or password"));
      resolve(user as UserDTO);
    })(req);
  });
}

export function getSession(req: Request): UserDTO | null {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return req.user as UserDTO;
  }
  return null;
}
