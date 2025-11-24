"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const rootController_1 = require("../controllers/rootController");
const router = (0, express_1.Router)();
router.get("/", (0, errorMiddleware_1.asyncHandler)(rootController_1.getApiInfo));
exports.default = router;
