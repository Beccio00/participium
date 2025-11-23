import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils";
import { User } from "@prisma/client";

export function isLoggedIn(req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  throw new UnauthorizedError("You don't have the right to access this resource");
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== 'ADMINISTRATOR') {
    throw new ForbiddenError("Administrator privileges required");
  }

  return next();
}

export function requireCitizen(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== 'CITIZEN') {
    throw new ForbiddenError("Only citizens can create reports");
  }

  return next();
}
