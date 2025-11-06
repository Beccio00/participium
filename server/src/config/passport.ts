import passport from "passport";
import { Strategy as LocalStrategy, IVerifyOptions } from "passport-local";
import { PublicUser, PrivateUser } from "../interfaces/User";
import { verifyPassword } from "../services/passwordService";
import { findByEmail } from "../services/userService";

export function configurePassport() {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email: string, password: string, done: (err: Error | null, user?: PublicUser | false, info?: IVerifyOptions) => void) => {
      try {
        const dbUser: PrivateUser | null = await findByEmail(email);
        if (!dbUser) return done(null, false, { message: "Incorrect email" });

        const valid = await verifyPassword(dbUser, password);
        if (!valid) return done(null, false, { message: "Incorrect password" });

        const publicUser = new PublicUser(dbUser.email, dbUser.firstName, dbUser.lastName, dbUser.role);
        return done(null, publicUser);
      } catch (err) {
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user: unknown, done: (err: any, email?: string) => void) => {
    const u = user as PublicUser;
    done(null, u.email);
  });

  passport.deserializeUser(async (email: string, done: (err: Error | null, user?: PublicUser | false) => void) => {
    try {
      const dbUser = await findByEmail(email);
      if (!dbUser) return done(null, false);
      const publicUser = new PublicUser(dbUser.email, dbUser.firstName, dbUser.lastName, dbUser.role);
      done(null, publicUser);
    } catch (err) {
      done(err as Error);
    }
  });
}