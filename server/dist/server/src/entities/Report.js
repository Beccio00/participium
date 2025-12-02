"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = exports.ReportStatus = exports.ReportCategory = void 0;
const typeorm_1 = require("typeorm");
var ReportCategory;
(function (ReportCategory) {
    ReportCategory["WATER_SUPPLY_DRINKING_WATER"] = "WATER_SUPPLY_DRINKING_WATER";
    ReportCategory["ARCHITECTURAL_BARRIERS"] = "ARCHITECTURAL_BARRIERS";
    ReportCategory["SEWER_SYSTEM"] = "SEWER_SYSTEM";
    ReportCategory["PUBLIC_LIGHTING"] = "PUBLIC_LIGHTING";
    ReportCategory["WASTE"] = "WASTE";
    ReportCategory["ROAD_SIGNS_TRAFFIC_LIGHTS"] = "ROAD_SIGNS_TRAFFIC_LIGHTS";
    ReportCategory["ROADS_URBAN_FURNISHINGS"] = "ROADS_URBAN_FURNISHINGS";
    ReportCategory["PUBLIC_GREEN_AREAS_PLAYGROUNDS"] = "PUBLIC_GREEN_AREAS_PLAYGROUNDS";
    ReportCategory["OTHER"] = "OTHER";
})(ReportCategory || (exports.ReportCategory = ReportCategory = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    ReportStatus["ASSIGNED"] = "ASSIGNED";
    ReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ReportStatus["SUSPENDED"] = "SUSPENDED";
    ReportStatus["REJECTED"] = "REJECTED";
    ReportStatus["RESOLVED"] = "RESOLVED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
let Report = class Report {
};
exports.Report = Report;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Report.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Report.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ReportCategory,
    }),
    __metadata("design:type", String)
], Report.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)("float"),
    __metadata("design:type", Number)
], Report.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)("float"),
    __metadata("design:type", Number)
], Report.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Report.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Report.prototype, "isAnonymous", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ReportStatus,
        default: ReportStatus.PENDING_APPROVAL,
    }),
    __metadata("design:type", String)
], Report.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Report.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], Report.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "rejectedReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Report.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Report.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", "reports"),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", Object)
], Report.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", "assignedReports", { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assignedToId" }),
    __metadata("design:type", Object)
], Report.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("ReportPhoto", "report"),
    __metadata("design:type", Array)
], Report.prototype, "photos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("ReportMessage", "report"),
    __metadata("design:type", Array)
], Report.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("Notification", "report"),
    __metadata("design:type", Array)
], Report.prototype, "notifications", void 0);
exports.Report = Report = __decorate([
    (0, typeorm_1.Entity)("Report")
], Report);
