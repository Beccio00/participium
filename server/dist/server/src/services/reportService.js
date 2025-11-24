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
exports.createReport = createReport;
exports.getApprovedReports = getApprovedReports;
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("../../prisma/generated/client");
function createReport(data) {
    return __awaiter(this, void 0, void 0, function* () {
        //here ther should be validation for the photos
        const newReport = yield prismaClient_1.prisma.report.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                latitude: data.latitude,
                longitude: data.longitude,
                isAnonymous: data.isAnonymous,
                status: client_1.ReportStatus.PENDING_APPROVAL, //new reports are always pending approval
                userId: data.userId,
                photos: {
                    create: data.photos.map((photo) => ({
                        url: photo.url,
                        filename: photo.filename,
                    })),
                },
            },
            include: {
                user: true,
                photos: true,
            },
        });
        return newReport;
    });
}
//get reports only after being approved
function getApprovedReports() {
    return __awaiter(this, void 0, void 0, function* () {
        return prismaClient_1.prisma.report.findMany({
            where: {
                status: {
                    in: [
                        client_1.ReportStatus.ASSIGNED,
                        client_1.ReportStatus.IN_PROGRESS,
                        client_1.ReportStatus.RESOLVED,
                    ],
                },
            },
            include: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc", //most recent first
            },
        });
    });
}
