import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { signup } from "../controllers/citizenController";
import { Roles } from "../interfaces/UserDTO";

const router = Router();

// POST /citizen/signup
router.post("/signup", asyncHandler(signup(Roles.CITIZEN)));

export default router;
