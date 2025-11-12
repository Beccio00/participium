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
exports.getReports = exports.createReport = void 0;
const reportService_1 = require("../services/reportService");
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, category, latitude, longitude, isAnonymous, photos } = req.body;
        const user = req.user; //need to get the userId
        //citizen must be logged in to create a report
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized', message: 'User not logged in'
            });
        }
        //validate required fields maybe can move it to service
        if (!title || !description || !category || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error: 'Bad Request', message: 'Missing required fields'
            });
        }
        const reportData = {
            title,
            description,
            category: category,
            latitude,
            longitude,
            isAnonymous,
            photos: photos || [],
            userId: user.id
        };
        const newReport = yield (0, reportService_1.createReport)(reportData);
        return res.status(201).json({
            message: 'Report created successfully',
            report: newReport
        });
    }
    catch (err) {
        console.error("Error creating report", err);
        return res.status(500).json({
            error: 'Internal Server Error', message: 'Unable to create report'
        });
    }
});
exports.createReport = createReport;
const getReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield (0, reportService_1.getApprovedReports)();
        res.status(200).json(reports);
    }
    catch (error) {
        console.error('Error during report retrieval:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Error during report retrieval'
        });
    }
});
exports.getReports = getReports;
