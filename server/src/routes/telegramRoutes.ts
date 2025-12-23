import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { isLoggedIn } from "../middlewares/routeProtection";
import { ApiValidationMiddleware } from "../middlewares/validationMiddlewere";
import {
  generateToken,
  linkAccount,
  getStatus,
  unlink,
} from "../controllers/telegramController";

const router = Router();

// POST /api/telegram/generate-token - Generate deep link token (requires authentication)
router.post(
  "/generate-token",
  isLoggedIn,
  ApiValidationMiddleware,
  asyncHandler(generateToken)
);

// POST /api/telegram/link - Link Telegram account (called by bot, no auth required)
router.post("/link", ApiValidationMiddleware, asyncHandler(linkAccount));

// GET /api/telegram/status - Get Telegram linking status (requires authentication)
router.get(
  "/status",
  isLoggedIn,
  ApiValidationMiddleware,
  asyncHandler(getStatus)
);

// DELETE /api/telegram/unlink - Unlink Telegram account (requires authentication)
router.delete(
  "/unlink",
  isLoggedIn,
  ApiValidationMiddleware,
  asyncHandler(unlink)
);

export default router;
