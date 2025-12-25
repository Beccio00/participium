import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { login, logout, getSessionInfo } from "../controllers/authController";

const router = Router();

//unregistered users can ee approved reports on an interactive map
router.post("/", asyncHandler(login));
router.delete("/current", asyncHandler(logout));
router.get("/current", asyncHandler(getSessionInfo));

export default router;