"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const citizenController_1 = require("../controllers/citizenController");
const UserDTO_1 = require("../interfaces/UserDTO");
const router = (0, express_1.Router)();
// POST /citizen/signup
router.post("/signup", (0, errorMiddleware_1.asyncHandler)((0, citizenController_1.signup)(UserDTO_1.Roles.CITIZEN)));
exports.default = router;
