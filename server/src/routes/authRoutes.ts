import express from "express";
import { login, logout, getSessionInfo } from "../controllers/authController";
import { isLoggedIn } from "../middleware/auth";

const router = express.Router();

// POST /session
router.post("/", login);
// DELETE /session
router.delete("/", logout);
// GET /session
router.get("/", isLoggedIn, getSessionInfo);

export default router;