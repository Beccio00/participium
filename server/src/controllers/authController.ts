import { Request, Response, NextFunction } from "express";
import { authenticate, getSession } from "../services/authService";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authenticate(req);

    req.logIn(user, (err?: unknown) => {
      if (err) return next(err as Error);
      return res.json({ message: "Logged in", user });
    });

  } catch (err: unknown) {
    if (err instanceof Error && err.message.toLowerCase().includes("invalid")) {
      return res.status(401).json({ message: err.message });
    }
    return next(err as Error);
  }
}

export function logout(req: Request, res: Response) {
  try {
    req.logout?.(() => {});
  } catch (e) {
    // ignore
  }

  if (req.session) {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  } else {
    res.json({ message: "Logged out" });
  }
}

export function getSessionInfo(req: Request, res: Response) {
  const user = getSession(req);
  if (!user) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user });
}
