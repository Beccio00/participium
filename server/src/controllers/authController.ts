import { Request, Response, NextFunction } from "express";
import { authenticate, getSession } from "../services/authService";
import { InvalidCredentialsError } from "../interfaces/errors/InvalidCredentialsError";

export async function login(req: Request, res: Response, next: NextFunction) {

  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(400).json({ 
      error: 'BadRequest', 
      message: 'Already logged in' 
    });
  }

  try {
    const user = await authenticate(req);

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: "Login successful", user });
    });

  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid username or password"
      });
    } else {
      return res.status(500).json({
        error: "InternalServerError",
        message: "An unexpected error occurred"
      });
    }
  }
}

export function logout(req: Request, res: Response) {
  if (!(req.isAuthenticated && req.isAuthenticated()) || !req.session) {
    return res.status(400).json({ 
      error: 'BadRequest', 
      message: 'Already logged out' 
    });
  }

  try {
    req.logout((err) => {
      if (err) throw err;
      req.session.destroy((err) => {
        if (err) throw err;
        return res.json({ message: 'Logged out' });
      });
    });
  } catch (e) {
    return res.status(500).json({ 
      error: 'InternalServerError', 
      message: 'Logout failed' 
    });
  }
}

export function getSessionInfo(req: Request, res: Response) {
  const user = getSession(req);
  if (!user) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user });
}
