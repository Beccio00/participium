import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { getApiInfo } from "../controllers/rootController";

const router = Router();

router.get("/", asyncHandler(getApiInfo));
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
