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
exports.ReportMessageRepository = void 0;
const AppDataSource_1 = require("../utils/AppDataSource");
const ReportMessage_1 = require("../entities/ReportMessage");
class ReportMessageRepository {
    constructor() {
        this.repository = AppDataSource_1.AppDataSource.getRepository(ReportMessage_1.ReportMessage);
    }
    findByReportId(reportId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.find({
                where: { reportId },
                relations: ["user"],
                order: { createdAt: "ASC" }
            });
        });
    }
    create(messageData) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.repository.create(messageData);
            const saved = yield this.repository.save(message);
            // Return with user relation loaded
            return yield this.repository.findOne({
                where: { id: saved.id },
                relations: ["user"]
            });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({
                where: { id },
                relations: ["user", "report"]
            });
        });
    }
}
exports.ReportMessageRepository = ReportMessageRepository;
