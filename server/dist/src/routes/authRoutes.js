"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
// POST /session
router.post("/", authController_1.login);
// DELETE /session/current
router.delete("/current", authController_1.logout);
// GET /session/current
router.get("/current", authController_1.getSessionInfo);
exports.default = router;
