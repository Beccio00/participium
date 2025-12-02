"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignedReports = getAssignedReports;
exports.createReport = createReport;
exports.getReports = getReports;
exports.getPendingReports = getPendingReports;
exports.approveReport = approveReport;
exports.getAssignableTechnicals = getAssignableTechnicals;
exports.rejectReport = rejectReport;
exports.updateReportStatus = updateReportStatus;
exports.sendMessageToCitizen = sendMessageToCitizen;
exports.getReportMessages = getReportMessages;
// Get reports assigned to the authenticated technical officer
const reportService_1 = require("../services/reportService");
function getAssignedReports(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        if (!user || !user.id) {
            throw new utils_1.UnauthorizedError("Authentication required");
        }
        // Only allow technical roles (not citizens, admins, public relations)
        const technicalRoles = [
            "CULTURE_EVENTS_TOURISM_SPORTS",
            "LOCAL_PUBLIC_SERVICES",
            "EDUCATION_SERVICES",
            "PUBLIC_RESIDENTIAL_HOUSING",
            "INFORMATION_SYSTEMS",
            "MUNICIPAL_BUILDING_MAINTENANCE",
            "PRIVATE_BUILDINGS",
            "INFRASTRUCTURES",
            "GREENSPACES_AND_ANIMAL_PROTECTION",
            "WASTE_MANAGEMENT",
            "ROAD_MAINTENANCE",
            "CIVIL_PROTECTION",
        ];
        if (!technicalRoles.includes(user.role)) {
            throw new utils_1.ForbiddenError("Technical office staff privileges required");
        }
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
        const order = typeof req.query.order === "string" ? req.query.order : undefined;
        // Validate status
        let statusFilter;
        if (status) {
            const allowed = ["ASSIGNED", "IN_PROGRESS", "RESOLVED"];
            if (!allowed.includes(status)) {
                throw new utils_1.BadRequestError("Invalid status filter");
            }
            statusFilter = status;
        }
        // Validate sortBy and order
        const allowedSort = ["createdAt", "priority"];
        const sortField = allowedSort.includes(sortBy !== null && sortBy !== void 0 ? sortBy : "") ? sortBy : "createdAt";
        const sortOrder = order === "asc" ? "asc" : "desc";
        // Call service
        const reports = yield (0, reportService_1.getAssignedReportsService)(user.id, statusFilter, sortField, sortOrder);
        res.status(200).json(reports);
    });
}
const path_1 = __importDefault(require("path"));
const reportService_2 = require("../services/reportService");
const ReportTypes_1 = require("../../../shared/ReportTypes");
const addressFinder_1 = require("../utils/addressFinder");
const minioClient_1 = __importStar(require("../utils/minioClient"));
const utils_1 = require("../utils");
function createReport(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        // Destructure fields from req.body and req.files
        const { title, description, category, latitude, longitude, isAnonymous } = req.body;
        // Multer stores files in req.files (array or object depending on config)
        let photos = [];
        if (Array.isArray(req.files)) {
            photos = req.files;
        }
        else if (req.files && req.files.photos) {
            photos = req.files.photos;
        }
        // Validate required fields
        if (!title ||
            !description ||
            !category ||
            latitude === undefined ||
            longitude === undefined) {
            throw new utils_1.BadRequestError("Missing required fields: title, description, category, latitude, longitude");
        }
        // Validate photos
        if (!photos || photos.length === 0) {
            throw new utils_1.BadRequestError("At least one photo is required");
        }
        if (photos.length > 3) {
            throw new utils_1.BadRequestError("Maximum 3 photos allowed");
        }
        // Validate category
        if (!Object.values(ReportTypes_1.ReportCategory).includes(category)) {
            throw new utils_1.BadRequestError(`Invalid category. Allowed values: ${Object.values(ReportTypes_1.ReportCategory).join(", ")}`);
        }
        // Validate coordinates
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);
        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            throw new utils_1.BadRequestError("Invalid coordinates: latitude and longitude must be valid numbers");
        }
        if (parsedLatitude < -90 || parsedLatitude > 90) {
            throw new utils_1.BadRequestError("Invalid latitude: must be between -90 and 90");
        }
        if (parsedLongitude < -180 || parsedLongitude > 180) {
            throw new utils_1.BadRequestError("Invalid longitude: must be between -180 and 180");
        }
        const photoData = [];
        if (photos && photos.length > 0) {
            for (const photo of photos) {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                const filename = uniqueSuffix + path_1.default.extname(photo.originalname);
                yield minioClient_1.default.putObject(minioClient_1.BUCKET_NAME, filename, photo.buffer, photo.size, { "Content-Type": photo.mimetype });
                const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
                const host = /*process.env.MINIO_ENDPOINT || */ "localhost";
                const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
                const url = `${protocol}://${host}${port}/${minioClient_1.BUCKET_NAME}/${filename}`;
                photoData.push({
                    id: 0,
                    filename: filename,
                    url: url,
                });
            }
        }
        const address = yield (0, addressFinder_1.calculateAddress)(parsedLatitude, parsedLongitude);
        const reportData = {
            title,
            description,
            category: category,
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            address,
            isAnonymous: isAnonymous === "true",
            photos: photoData,
            userId: user.id,
        };
        const newReport = yield (0, reportService_2.createReport)(reportData);
        res.status(201).json({
            message: "Report created successfully",
            id: newReport.id,
        });
    });
}
function getReports(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { category } = req.query;
        if (category &&
            !Object.values(ReportTypes_1.ReportCategory).includes(category)) {
            throw new utils_1.BadRequestError(`Invalid category. Allowed: ${Object.values(ReportTypes_1.ReportCategory).join(", ")}`);
        }
        const reports = yield (0, reportService_2.getApprovedReports)(category);
        res.status(200).json(reports);
    });
}
// Get pending reports (PUBLIC_RELATIONS only)
function getPendingReports(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reports = yield (0, reportService_2.getPendingReports)();
        res.status(200).json(reports);
    });
}
// Approve a report (PUBLIC_RELATIONS only)
function approveReport(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        const user = req.user;
        const assignedTechnicalId = (req.body && req.body.assignedTechnicalId);
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        const assignedIdNum = parseInt(assignedTechnicalId);
        if (!assignedTechnicalId || isNaN(parseInt(assignedTechnicalId))) {
            throw new utils_1.BadRequestError("Missing or invalid 'assignedTechnicalId' in request body");
        }
        const updatedReport = yield (0, reportService_2.approveReport)(reportId, user.id, assignedIdNum);
        res.status(200).json({
            message: "Report approved and assigned successfully",
            report: updatedReport,
        });
    });
}
// Get list of assignable technicals for a report (PUBLIC_RELATIONS only)
function getAssignableTechnicals(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        const list = yield (0, reportService_2.getAssignableTechnicalsForReport)(reportId);
        res.status(200).json(list);
    });
}
// Reject a report (PUBLIC_RELATIONS only)
function rejectReport(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        const user = req.user;
        const { reason } = req.body;
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
            throw new utils_1.BadRequestError("Missing rejection reason");
        }
        const updatedReport = yield (0, reportService_2.rejectReport)(reportId, user.id, reason);
        res.status(200).json({
            message: "Report rejected successfully",
            report: updatedReport,
        });
    });
}
// Update report status
function updateReportStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        const user = req.user;
        const { status } = req.body;
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        if (!status || typeof status !== "string") {
            throw new utils_1.BadRequestError("Status is required");
        }
        // Validate status
        const validStatuses = [ReportTypes_1.ReportStatus.IN_PROGRESS, ReportTypes_1.ReportStatus.SUSPENDED, ReportTypes_1.ReportStatus.RESOLVED];
        if (!validStatuses.includes(status)) {
            throw new utils_1.BadRequestError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`);
        }
        const updatedReport = yield (0, reportService_2.updateReportStatus)(reportId, user.id, status);
        res.status(200).json({
            message: "Report status updated successfully",
            report: updatedReport,
        });
    });
}
// Send message to citizen
function sendMessageToCitizen(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        const user = req.user;
        const { content } = req.body;
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            throw new utils_1.BadRequestError("Message content is required");
        }
        const message = yield (0, reportService_2.sendMessageToCitizen)(reportId, user.id, content);
        res.status(201).json({
            message: "Message sent successfully",
            data: message,
        });
    });
}
// Get report conversation history
function getReportMessages(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const reportId = parseInt(req.params.reportId);
        const user = req.user;
        if (isNaN(reportId)) {
            throw new utils_1.BadRequestError("Invalid report ID parameter");
        }
        const messages = yield (0, reportService_2.getReportMessages)(reportId, user.id);
        res.status(200).json(messages);
    });
}
