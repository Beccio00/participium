import { Request, Response, NextFunction } from "express";

export function isLoggedIn(req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ 
    error: "Unauthorized",
    message: "You don't have the right to access this resource"
  });
}
