import passport from "passport";
import { Strategy as LocalStrategy, IVerifyOptions } from "passport-local";
import { PublicUser, PrivateUser } from "../interfaces/User";
import { verifyPassword } from "../services/passwordService";
import { findByUsername, findById } from "../services/userService";

export function configurePassport() {
  passport.use(
    new LocalStrategy(async (username: string, password: string, done: (err: Error | null, user?: PublicUser | false, info?: IVerifyOptions) => void) => {
      try {
        const dbUser: PrivateUser | null = await findByUsername(username);
        if (!dbUser) return done(null, false, { message: "Incorrect username" });

        const valid = await verifyPassword(dbUser, password);
        if (!valid) return done(null, false, { message: "Incorrect password" });

        const publicUser = new PublicUser(dbUser.id, dbUser.username);
        return done(null, publicUser);
      } catch (err) {
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user: unknown, done: (err: any, id?: unknown) => void) => {
    const u = user as PublicUser;
    done(null, u.id);
  });

  passport.deserializeUser(async (id: string, done: (err: Error | null, user?: PublicUser | false) => void) => {
    try {
      const dbUser = await findById(id);
      if (!dbUser) return done(null, false);
      const publicUser = new PublicUser(dbUser.id, dbUser.username);
      done(null, publicUser);
    } catch (err) {
      done(err as Error);
    }
  });
}