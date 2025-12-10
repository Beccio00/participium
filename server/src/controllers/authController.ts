import { Request, Response } from "express";
import { authenticate, getSession } from "../services/authService";
import { BadRequestError, InternalServerError } from "../utils";


export async function login(req: Request, res: Response): Promise<void> {
  if (req.isAuthenticated && req.isAuthenticated()) {
    throw new BadRequestError("Already logged in");
  }

  const user = await authenticate(req);

  req.logIn(user, (err) => {
    if (err) throw new InternalServerError("Login failed");
    res.json({ message: "Login successful", user });
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!(req.isAuthenticated && req.isAuthenticated()) || !req.session) {
    throw new BadRequestError("Already logged out");
  }

  req.logout((err) => {
    if (err) throw new InternalServerError("Logout failed");
    req.session.destroy((err) => {
      if (err) throw new InternalServerError("Logout failed");
      res.json({ message: "Logged out" });
    });
  });
}

export async function getSessionInfo(req: Request, res: Response): Promise<void> {
  const user = getSession(req);
  if (!user) {
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user });
}
