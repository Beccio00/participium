import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { getApiInfo } from "../controllers/rootController";

const router = Router();

router.get("/", asyncHandler(getApiInfo));

export default router;
