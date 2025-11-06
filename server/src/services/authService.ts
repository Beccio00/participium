import passport from "passport";
import { PublicUser } from "../interfaces/User";
import { Request } from "express";

export async function authenticate(req: Request): Promise<PublicUser> {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (err: Error | null, user?: PublicUser | false) => {
      if (err) return reject(err);
      if (!user) return reject(new Error("Invalid credentials"));
      resolve(new PublicUser(user.email, user.firstName, user.lastName, user.role));
    })(req);
  });
}

export function getSession(req: Request): PublicUser | null {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as PublicUser;
    return new PublicUser(user.email, user.firstName, user.lastName, user.role);
  }
  return null;
}
