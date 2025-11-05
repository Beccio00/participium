import passport from "passport";
import { PublicUser } from "../interfaces/User";
import { Request } from "express";
import { IVerifyOptions } from "passport-local";

export async function authenticate(req: Request): Promise<PublicUser> {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (err: Error | null, user?: PublicUser | false, info?: IVerifyOptions) => {
      if (err) return reject(err);
      if (!user) return reject(new Error(info?.message || "Invalid credentials"));
      resolve(new PublicUser(user.id, user.username));
    })(req);
  });
}

export function getSession(req: Request): PublicUser | null {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as PublicUser;
    return new PublicUser(user.id, user.username);
  }
  return null;
}
