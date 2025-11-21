import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";

// isLoggedIn checks if the user is authenticated
export function isLoggedIn(req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ 
    error: "Unauthorized",
    message: "You don't have the right to access this resource"
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required"
    });
  }

  if (!authReq.user || authReq.user.role !== 'ADMINISTRATOR') {
    return res.status(403).json({
      error: "Forbidden",
      message: "Administrator privileges required"
    });
  }

  return next();
}
