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
exports.User = exports.Role = void 0;
const typeorm_1 = require("typeorm");
var Role;
(function (Role) {
    Role["CITIZEN"] = "CITIZEN";
    Role["ADMINISTRATOR"] = "ADMINISTRATOR";
    Role["PUBLIC_RELATIONS"] = "PUBLIC_RELATIONS";
    Role["CULTURE_EVENTS_TOURISM_SPORTS"] = "CULTURE_EVENTS_TOURISM_SPORTS";
    Role["LOCAL_PUBLIC_SERVICES"] = "LOCAL_PUBLIC_SERVICES";
    Role["EDUCATION_SERVICES"] = "EDUCATION_SERVICES";
    Role["PUBLIC_RESIDENTIAL_HOUSING"] = "PUBLIC_RESIDENTIAL_HOUSING";
    Role["INFORMATION_SYSTEMS"] = "INFORMATION_SYSTEMS";
    Role["MUNICIPAL_BUILDING_MAINTENANCE"] = "MUNICIPAL_BUILDING_MAINTENANCE";
    Role["PRIVATE_BUILDINGS"] = "PRIVATE_BUILDINGS";
    Role["INFRASTRUCTURES"] = "INFRASTRUCTURES";
    Role["GREENSPACES_AND_ANIMAL_PROTECTION"] = "GREENSPACES_AND_ANIMAL_PROTECTION";
    Role["WASTE_MANAGEMENT"] = "WASTE_MANAGEMENT";
    Role["ROAD_MAINTENANCE"] = "ROAD_MAINTENANCE";
    Role["CIVIL_PROTECTION"] = "CIVIL_PROTECTION";
})(Role || (exports.Role = Role = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "first_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "last_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "salt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: Role,
        default: Role.CITIZEN,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "telegram_username", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "email_notifications_enabled", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("Report", "user"),
    __metadata("design:type", Array)
], User.prototype, "reports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("ReportMessage", "user"),
    __metadata("design:type", Array)
], User.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("Report", "assignedTo"),
    __metadata("design:type", Array)
], User.prototype, "assignedReports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("Notification", "user"),
    __metadata("design:type", Array)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToOne)("CitizenPhoto", "user"),
    __metadata("design:type", Object)
], User.prototype, "photo", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("User")
], User);
