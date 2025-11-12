import express from "express";
import { signup } from "../controllers/citizenController";
import { Roles } from "../interfaces/UserDTO";

const router = express.Router();

// POST /citizen/signup
router.post("/signup", signup(Roles.CITIZEN));

export default router;
