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
exports.NotificationRepository = void 0;
const AppDataSource_1 = require("../utils/AppDataSource");
const Notification_1 = require("../entities/Notification");
class NotificationRepository {
    constructor() {
        this.repository = AppDataSource_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({ where: { id } });
        });
    }
    findByUserId(userId, unreadOnly, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereCondition = { userId };
            if (unreadOnly) {
                whereCondition.isRead = false;
            }
            return yield this.repository.find({
                where: whereCondition,
                order: { createdAt: "DESC" },
                take: limit
            });
        });
    }
    create(notificationData) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = this.repository.create(notificationData);
            return yield this.repository.save(notification);
        });
    }
    markAsRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.update(id, { isRead: true });
            return yield this.findById(id);
        });
    }
    markAllAsReadForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.update({ userId }, { isRead: true });
        });
    }
}
exports.NotificationRepository = NotificationRepository;
