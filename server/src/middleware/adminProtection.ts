import { Request, Response, NextFunction } from "express";
import { User } from "../../prisma/generated/client";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Type assertion for the authenticated request
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };
  
  // First check if user is authenticated
  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required"
    });
  }

  // Check if user has admin role
  if (!authReq.user || authReq.user.role !== 'ADMINISTRATOR') {
    return res.status(403).json({
      error: "Forbidden",
      message: "Administrator privileges required"
    });
  }

  return next();
}