import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { requireCitizen } from "../middlewares/routeProtection";
import { ApiValidationMiddleware } from "../middlewares/validationMiddlewere";
import {
  generateToken,
  linkAccount,
  getStatus,
  unlink,
  createReport,
  getMyReports,
  getReportStatus,
  checkLinked
} from "../controllers/telegramController";

const router = Router();

// POST /api/telegram/generate-token - Generate deep link token (requires citizen auth)
router.post(
  "/generate-token",
  requireCitizen,
  ApiValidationMiddleware,
  asyncHandler(generateToken)
);

// POST /api/telegram/link - Link Telegram account (called by bot, no auth required)
router.post("/link", ApiValidationMiddleware, asyncHandler(linkAccount));

// GET /api/telegram/status - Get Telegram linking status (requires citizen auth)
router.get(
  "/status",
  requireCitizen,
  ApiValidationMiddleware,
  asyncHandler(getStatus)
);

// DELETE /api/telegram/unlink - Unlink Telegram account (requires citizen auth)
router.delete(
  "/unlink",
  requireCitizen,
  ApiValidationMiddleware,
  asyncHandler(unlink)
);

// POST /api/telegram/reports - Create a new report (called by bot, authenticated via telegramId in body)
router.post("/reports", ApiValidationMiddleware, asyncHandler(createReport));

// GET /api/telegram/:telegramId/reports - Get user's reports (called by bot)
router.get(
  "/:telegramId/reports",
  ApiValidationMiddleware,
  asyncHandler(getMyReports)
);

// GET /api/telegram/:telegramId/reports/:reportId - Get report status (called by bot)
router.get(
  "/:telegramId/reports/:reportId",
  ApiValidationMiddleware,
  asyncHandler(getReportStatus)
);

// POST /api/telegram/check-linked - Check if a telegramId is linked to a user (called by bot)
router.post("/check-linked", ApiValidationMiddleware, asyncHandler(checkLinked));

export default router;
