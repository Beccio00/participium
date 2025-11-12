import { Request, Response } from "express";
import { CONFIG } from "../config/constants";

export async function getApiInfo(req: Request, res: Response): Promise<void> {
  res.json({
    message: CONFIG.API.NAME,
    version: CONFIG.API.VERSION,
    description: CONFIG.API.DESCRIPTION,
    endpoints: {
      auth: CONFIG.ROUTES.SESSION,
      citizens: CONFIG.ROUTES.CITIZEN,
      admin: CONFIG.ROUTES.ADMIN,
      reports: CONFIG.ROUTES.REPORTS,
      docs: CONFIG.ROUTES.SWAGGER,
    },
  });
}
