import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils";
import { User } from "../entities/User";
import { TECHNICAL_ROLES, TECHNICAL_AND_EXTERNAL_ROLES } from "../interfaces/UserDTO";
import { Role } from "../../../shared/RoleTypes";

export function isLoggedIn(req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  throw new UnauthorizedError("You don't have the right to access this resource");
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== Role.ADMINISTRATOR) {
    throw new ForbiddenError("Administrator privileges required");
  }

  return next();
}

export function requireCitizen(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== Role.CITIZEN) {
    throw new ForbiddenError("Only citizens can create reports");
  }

  return next();
}

export function requirePublicRelations(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== 'PUBLIC_RELATIONS') {
    throw new ForbiddenError("Public relations officer privileges required");
  }

  return next();
}


export function requireTechnicalStaffOnly(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!TECHNICAL_ROLES.includes(authReq.user.role)) {
    throw new ForbiddenError("Municipality technical staff privileges required");
  }

  return next();
}

export function requireTechnicalOrExternal(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!TECHNICAL_AND_EXTERNAL_ROLES.includes(authReq.user.role)) {
    throw new ForbiddenError("Technical staff or external maintainer privileges required");
  }

  return next();
}

export function requireExternalMaintainer(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user || authReq.user.role !== Role.EXTERNAL_MAINTAINER) {
    throw new ForbiddenError("External maintainer privileges required");
  }

  return next();
}




export function requireCitizenOrTechnicalOrExternal(req: Request, res: Response, next: NextFunction) {
  const authReq = req as Request & { user?: User; isAuthenticated?: () => boolean };

  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!authReq.user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (authReq.user.role !== Role.CITIZEN && !TECHNICAL_AND_EXTERNAL_ROLES.includes(authReq.user.role)) {
    throw new ForbiddenError("Citizen, technical staff, or external maintainer privileges required");
  }

  return next();
}