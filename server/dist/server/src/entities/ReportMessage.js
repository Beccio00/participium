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
exports.ReportMessage = void 0;
const typeorm_1 = require("typeorm");
let ReportMessage = class ReportMessage {
};
exports.ReportMessage = ReportMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReportMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReportMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReportMessage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReportMessage.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReportMessage.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Report", "messages"),
    (0, typeorm_1.JoinColumn)({ name: "reportId" }),
    __metadata("design:type", Object)
], ReportMessage.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", "messages"),
    (0, typeorm_1.JoinColumn)({ name: "senderId" }),
    __metadata("design:type", Object)
], ReportMessage.prototype, "user", void 0);
exports.ReportMessage = ReportMessage = __decorate([
    (0, typeorm_1.Entity)("ReportMessage")
], ReportMessage);
