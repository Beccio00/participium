"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const CitizenPhoto_1 = require("../entities/CitizenPhoto");
const Report_1 = require("../entities/Report");
const ReportPhoto_1 = require("../entities/ReportPhoto");
const ReportMessage_1 = require("../entities/ReportMessage");
const Notification_1 = require("../entities/Notification");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User_1.User, CitizenPhoto_1.CitizenPhoto, Report_1.Report, ReportPhoto_1.ReportPhoto, ReportMessage_1.ReportMessage, Notification_1.Notification],
    migrations: ["src/migrations/*.ts"],
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
});
exports.default = exports.AppDataSource;
