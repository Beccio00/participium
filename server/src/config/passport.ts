import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { toUserDTO, UserDTO } from "../interfaces/UserDTO";
import type { User as PrismaUser } from "../../prisma/generated/client";
import { verifyPassword } from "../services/passwordService";
import { findByEmail,findById } from "../services/userService";

export function configurePassport() {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email: string, password: string, done: (err: Error | null, user?: UserDTO | false) => void) => {
      try {
        const dbUser: PrismaUser | null = await findByEmail(email);
        if (!dbUser) return done(null, false);

        const valid = await verifyPassword(dbUser, password);
        if (!valid) return done(null, false);

        const publicUser = toUserDTO(dbUser);
        return done(null, publicUser);
      } catch (err) {
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user: unknown, done: (err: any, id?: number) => void) => {
    const u = user as UserDTO;
    done(null, u.id);
  });

  passport.deserializeUser(async (id: number, done: (err: Error | null, user?: UserDTO | false) => void) => {
    try {
      const dbUser = await findById(id);
      if (!dbUser) return done(null, false);
      const publicUser = toUserDTO(dbUser);
      done(null, publicUser);
    } catch (err) {
      done(err as Error);
    }
  });
}