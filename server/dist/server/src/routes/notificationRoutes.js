"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const routeProtection_1 = require("../middlewares/routeProtection");
const validationMiddlewere_1 = require("../middlewares/validationMiddlewere");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
// GET /api/notifications - Get user notifications
router.get('/', routeProtection_1.isLoggedIn, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(notificationController_1.getUserNotifications));
// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', routeProtection_1.isLoggedIn, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(notificationController_1.markNotificationAsRead));
exports.default = router;
