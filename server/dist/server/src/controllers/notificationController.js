"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
const errors_1 = require("../utils/errors");
const notificationService_1 = require("../services/notificationService");
// Get user notifications
function getUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const { unreadOnly, limit } = req.query;
        const unreadOnlyBool = unreadOnly === "true";
        const limitNum = limit ? parseInt(limit) : undefined;
        if (limit && isNaN(limitNum)) {
            throw new errors_1.BadRequestError("Invalid limit parameter");
        }
        const notifications = yield (0, notificationService_1.getUserNotifications)(user.id, unreadOnlyBool, limitNum);
        res.status(200).json(notifications);
    });
}
// Mark notification as read
function markNotificationAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const notificationId = parseInt(req.params.notificationId);
        if (isNaN(notificationId)) {
            throw new errors_1.BadRequestError("Invalid notification ID parameter");
        }
        const notification = yield (0, notificationService_1.markNotificationAsRead)(notificationId, user.id);
        res.status(200).json({
            message: "Notification marked as read",
            notification,
        });
    });
}
