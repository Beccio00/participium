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
exports.ReportRepository = void 0;
const typeorm_1 = require("typeorm");
const AppDataSource_1 = require("../utils/AppDataSource");
const Report_1 = require("../entities/Report");
class ReportRepository {
    constructor() {
        this.repository = AppDataSource_1.AppDataSource.getRepository(Report_1.Report);
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({ where: { id } });
        });
    }
    findByIdWithRelations(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({
                where: { id },
                relations: ["user", "assignedTo", "photos", "messages", "messages.user"]
            });
        });
    }
    findByStatus(statuses) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.find({
                where: { status: (0, typeorm_1.In)(statuses) },
                relations: ["user", "photos", "messages", "messages.user"],
                order: { createdAt: "DESC" }
            });
        });
    }
    findByStatusAndCategory(statuses, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereCondition = { status: (0, typeorm_1.In)(statuses) };
            if (category) {
                whereCondition.category = category;
            }
            return yield this.repository.find({
                where: whereCondition,
                relations: ["user", "photos", "messages", "messages.user"],
                order: { createdAt: "DESC" }
            });
        });
    }
    findAssignedToUser(userId, statuses) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.find({
                where: {
                    assignedToId: userId,
                    status: (0, typeorm_1.In)(statuses)
                },
                relations: ["user", "assignedTo", "photos", "messages", "messages.user"],
                order: { createdAt: "DESC" }
            });
        });
    }
    create(reportData) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const reportWithDates = Object.assign(Object.assign({}, reportData), { createdAt: now, updatedAt: now });
            const report = this.repository.create(reportWithDates);
            const savedReport = yield this.repository.save(report);
            return savedReport;
        });
    }
    update(id, reportData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.update(id, reportData);
            return yield this.findByIdWithRelations(id);
        });
    }
    findByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({
                where: { category },
                select: ["category"]
            });
        });
    }
}
exports.ReportRepository = ReportRepository;
