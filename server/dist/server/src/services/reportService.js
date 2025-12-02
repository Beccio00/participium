"use strict";
// =========================
// IMPORTS
// =========================
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
exports.TechnicalType = void 0;
exports.getAssignableTechnicalsForReport = getAssignableTechnicalsForReport;
exports.getAssignedReportsService = getAssignedReportsService;
exports.createReport = createReport;
exports.getApprovedReports = getApprovedReports;
exports.getPendingReports = getPendingReports;
exports.approveReport = approveReport;
exports.rejectReport = rejectReport;
exports.updateReportStatus = updateReportStatus;
exports.sendMessageToCitizen = sendMessageToCitizen;
exports.getReportMessages = getReportMessages;
// DTOs and interfaces
const ReportDTO_1 = require("../interfaces/ReportDTO");
// Repositories
const ReportRepository_1 = require("../repositories/ReportRepository");
const ReportMessageRepository_1 = require("../repositories/ReportMessageRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const ReportPhotoRepository_1 = require("../repositories/ReportPhotoRepository");
// Services and utilities
const notificationService_1 = require("./notificationService");
const errors_1 = require("../utils/errors");
// =========================
// REPOSITORY INSTANCES
// =========================
const reportRepository = new ReportRepository_1.ReportRepository();
const reportMessageRepository = new ReportMessageRepository_1.ReportMessageRepository();
const userRepository = new UserRepository_1.UserRepository();
const reportPhotoRepository = new ReportPhotoRepository_1.ReportPhotoRepository();
// =========================
// ENUMS AND TYPES
// =========================
var TechnicalType;
(function (TechnicalType) {
    TechnicalType["CULTURE_EVENTS_TOURISM_SPORTS"] = "CULTURE_EVENTS_TOURISM_SPORTS";
    TechnicalType["LOCAL_PUBLIC_SERVICES"] = "LOCAL_PUBLIC_SERVICES";
    TechnicalType["EDUCATION_SERVICES"] = "EDUCATION_SERVICES";
    TechnicalType["PUBLIC_RESIDENTIAL_HOUSING"] = "PUBLIC_RESIDENTIAL_HOUSING";
    TechnicalType["INFORMATION_SYSTEMS"] = "INFORMATION_SYSTEMS";
    TechnicalType["MUNICIPAL_BUILDING_MAINTENANCE"] = "MUNICIPAL_BUILDING_MAINTENANCE";
    TechnicalType["PRIVATE_BUILDINGS"] = "PRIVATE_BUILDINGS";
    TechnicalType["INFRASTRUCTURES"] = "INFRASTRUCTURES";
    TechnicalType["GREENSPACES_AND_ANIMAL_PROTECTION"] = "GREENSPACES_AND_ANIMAL_PROTECTION";
    TechnicalType["WASTE_MANAGEMENT"] = "WASTE_MANAGEMENT";
    TechnicalType["ROAD_MAINTENANCE"] = "ROAD_MAINTENANCE";
    TechnicalType["CIVIL_PROTECTION"] = "CIVIL_PROTECTION";
})(TechnicalType || (exports.TechnicalType = TechnicalType = {}));
// =========================
// MAPPINGS AND HELPERS
// =========================
const categoryToTechnical = {
    [ReportDTO_1.ReportCategory.WATER_SUPPLY_DRINKING_WATER]: [
        TechnicalType.LOCAL_PUBLIC_SERVICES,
        TechnicalType.INFRASTRUCTURES,
    ],
    [ReportDTO_1.ReportCategory.ARCHITECTURAL_BARRIERS]: [
        TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
        TechnicalType.PRIVATE_BUILDINGS,
    ],
    [ReportDTO_1.ReportCategory.SEWER_SYSTEM]: [
        TechnicalType.INFRASTRUCTURES,
        TechnicalType.WASTE_MANAGEMENT,
    ],
    [ReportDTO_1.ReportCategory.PUBLIC_LIGHTING]: [
        TechnicalType.LOCAL_PUBLIC_SERVICES,
        TechnicalType.INFRASTRUCTURES,
    ],
    [ReportDTO_1.ReportCategory.WASTE]: [
        TechnicalType.WASTE_MANAGEMENT,
        TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION,
    ],
    [ReportDTO_1.ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS]: [
        TechnicalType.ROAD_MAINTENANCE,
        TechnicalType.INFRASTRUCTURES,
    ],
    [ReportDTO_1.ReportCategory.ROADS_URBAN_FURNISHINGS]: [
        TechnicalType.ROAD_MAINTENANCE,
        TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
    ],
    [ReportDTO_1.ReportCategory.PUBLIC_GREEN_AREAS_PLAYGROUNDS]: [
        TechnicalType.GREENSPACES_AND_ANIMAL_PROTECTION,
        TechnicalType.MUNICIPAL_BUILDING_MAINTENANCE,
    ],
    [ReportDTO_1.ReportCategory.OTHER]: Object.values(TechnicalType),
};
function getTechnicalTypesForCategory(category) {
    return categoryToTechnical[category] || [];
}
/**
 * Restituisce la lista di tecnici validi per la categoria del report
 * @param reportId id del report
 */
function getAssignableTechnicalsForReport(reportId) {
    return __awaiter(this, void 0, void 0, function* () {
        const report = yield reportRepository.findById(reportId);
        if (!report)
            throw new errors_1.NotFoundError("Report not found");
        const validTechnicalTypes = getTechnicalTypesForCategory(report.category);
        // Usiamo i Role esistenti come tipi tecnici: filtriamo gli utenti il cui `role` è in validTechnicalTypes
        const validRoles = validTechnicalTypes.map((t) => t);
        const technicals = yield userRepository.findByRoles(validRoles);
        return technicals;
    });
}
// =========================
// REPORT MANAGEMENT FUNCTIONS
// =========================
/**
 * Restituisce i report assegnati all'utente tecnico autenticato
 */
function getAssignedReportsService(userId_1, status_1) {
    return __awaiter(this, arguments, void 0, function* (userId, status, sortBy = "createdAt", order = "desc") {
        // Only allow technical statuses
        const allowedStatuses = [
            ReportDTO_1.ReportStatus.ASSIGNED,
            ReportDTO_1.ReportStatus.IN_PROGRESS,
            ReportDTO_1.ReportStatus.RESOLVED,
        ];
        let statusFilter = allowedStatuses;
        if (status && allowedStatuses.includes(status)) {
            statusFilter = [status];
        }
        const reports = yield reportRepository.findAssignedToUser(userId, statusFilter);
        return reports.map(ReportDTO_1.toReportDTO);
    });
}
/**
 * Crea un nuovo report
 */
function createReport(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the report entity
        const savedReport = yield reportRepository.create({
            title: data.title,
            description: data.description,
            category: data.category,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address || null,
            isAnonymous: data.isAnonymous,
            status: ReportDTO_1.ReportStatus.PENDING_APPROVAL,
            userId: data.userId,
        });
        // Create photos separately if any
        if (data.photos && data.photos.length > 0) {
            const photosData = data.photos.map((photo) => ({
                url: photo.url,
                filename: photo.filename,
                reportId: savedReport.id,
            }));
            yield reportPhotoRepository.createMany(photosData);
        }
        // Return the report with all relations
        const reportWithRelations = yield reportRepository.findByIdWithRelations(savedReport.id);
        return reportWithRelations;
    });
}
/**
 * Restituisce i report approvati (assegnati, in corso, risolti)
 */
function getApprovedReports(category) {
    return __awaiter(this, void 0, void 0, function* () {
        const reports = yield reportRepository.findByStatusAndCategory([
            ReportDTO_1.ReportStatus.ASSIGNED,
            ReportDTO_1.ReportStatus.IN_PROGRESS,
            ReportDTO_1.ReportStatus.RESOLVED,
        ], category);
        return reports.map(ReportDTO_1.toReportDTO);
    });
}
/**
 * Restituisce i report in attesa di approvazione
 */
function getPendingReports() {
    return __awaiter(this, void 0, void 0, function* () {
        const reports = yield reportRepository.findByStatus([ReportDTO_1.ReportStatus.PENDING_APPROVAL]);
        return reports.map(ReportDTO_1.toReportDTO);
    });
}
// =========================
// APPROVAL AND REJECTION FUNCTIONS
// =========================
/**
 * Approva un report e lo assegna a un tecnico selezionato (solo PUBLIC_RELATIONS)
 */
function approveReport(reportId, approverId, assignedTechnicalId) {
    return __awaiter(this, void 0, void 0, function* () {
        const report = yield reportRepository.findByIdWithRelations(reportId);
        if (!report)
            throw new errors_1.NotFoundError("Report not found");
        if (report.status !== ReportDTO_1.ReportStatus.PENDING_APPROVAL) {
            throw new errors_1.BadRequestError("Report is not in PENDING_APPROVAL status");
        }
        // Verifica che il tecnico assegnato sia valido per la categoria
        const validTechnicalTypes = getTechnicalTypesForCategory(report.category);
        const validRoles = validTechnicalTypes.map((t) => t);
        const assignedTechnical = yield userRepository.findById(assignedTechnicalId);
        if (!assignedTechnical || !validRoles.includes(assignedTechnical.role)) {
            throw new errors_1.UnprocessableEntityError("Assigned technical is not valid for this report category");
        }
        const updatedReport = yield reportRepository.update(reportId, {
            status: ReportDTO_1.ReportStatus.ASSIGNED,
            assignedToId: assignedTechnical.id,
        });
        if (!updatedReport)
            throw new errors_1.NotFoundError("Report not found after update");
        // Notify citizen about approval
        yield (0, notificationService_1.notifyReportApproved)(report.id, report.userId, report.title);
        // Notify technical user about assignment
        yield (0, notificationService_1.notifyReportAssigned)(report.id, assignedTechnicalId, report.title);
        return (0, ReportDTO_1.toReportDTO)(updatedReport);
    });
}
/**
 * Rifiuta un report con motivazione (solo PUBLIC_RELATIONS)
 */
function rejectReport(reportId, rejecterId, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!reason || reason.trim().length === 0) {
            throw new errors_1.BadRequestError("Rejection reason is required");
        }
        if (reason.length > 500) {
            throw new errors_1.UnprocessableEntityError("Rejection reason must be less than 500 characters");
        }
        const report = yield reportRepository.findByIdWithRelations(reportId);
        if (!report) {
            throw new errors_1.NotFoundError("Report not found");
        }
        if (report.status !== ReportDTO_1.ReportStatus.PENDING_APPROVAL) {
            throw new errors_1.BadRequestError("Report is not in PENDING_APPROVAL status");
        }
        // Update report status and reason
        const updatedReport = yield reportRepository.update(reportId, {
            status: ReportDTO_1.ReportStatus.REJECTED,
            rejectedReason: reason,
        });
        // Create rejection message
        yield reportMessageRepository.create({
            content: "Report rejected by public relations officer",
            senderId: rejecterId,
            reportId: reportId,
        });
        if (!updatedReport)
            throw new errors_1.NotFoundError("Report not found after update");
        // Notify citizen about rejection
        yield (0, notificationService_1.notifyReportRejected)(report.id, report.userId, report.title, reason);
        return (0, ReportDTO_1.toReportDTO)(updatedReport);
    });
}
// =========================
// TECHNICAL USER FUNCTIONS
// =========================
/**
 * Aggiorna lo stato di un report (solo technical)
 */
function updateReportStatus(reportId, technicalUserId, newStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        const report = yield reportRepository.findByIdWithRelations(reportId);
        if (!report) {
            throw new errors_1.NotFoundError("Report not found");
        }
        // Verifica che il technical sia assegnato a questo report
        if (report.assignedToId !== technicalUserId) {
            throw new errors_1.ForbiddenError("You are not assigned to this report");
        }
        const oldStatus = report.status;
        const updatedReport = yield reportRepository.update(reportId, { status: newStatus });
        if (!updatedReport)
            throw new errors_1.NotFoundError("Report not found after update");
        // Notify citizen about status change
        yield (0, notificationService_1.notifyReportStatusChange)(report.id, report.userId, oldStatus, newStatus);
        return (0, ReportDTO_1.toReportDTO)(updatedReport);
    });
}
/**
 * Invia un messaggio al cittadino (solo technical)
 */
function sendMessageToCitizen(reportId, technicalUserId, content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const report = yield reportRepository.findByIdWithRelations(reportId);
        if (!report) {
            throw new errors_1.NotFoundError("Report not found");
        }
        // Verifica che il technical sia assegnato a questo report
        if (report.assignedToId !== technicalUserId) {
            throw new errors_1.ForbiddenError("You are not assigned to this report");
        }
        const savedMessage = yield reportMessageRepository.create({
            content,
            reportId,
            senderId: technicalUserId,
        });
        // Notifica il cittadino del nuovo messaggio
        const senderName = `${(_a = report.assignedTo) === null || _a === void 0 ? void 0 : _a.first_name} ${(_b = report.assignedTo) === null || _b === void 0 ? void 0 : _b.last_name}`;
        yield (0, notificationService_1.notifyNewMessage)(report.id, report.userId, senderName);
        return {
            id: savedMessage.id,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt.toISOString(),
            senderId: savedMessage.senderId,
        };
    });
}
// =========================
// MESSAGE FUNCTIONS
// =========================
/**
 * Ottieni tutti i messaggi di un report (cittadino o technical)
 */
function getReportMessages(reportId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const report = yield reportRepository.findByIdWithRelations(reportId);
        if (!report) {
            throw new errors_1.NotFoundError("Report not found");
        }
        // Verifica autorizzazione: il cittadino può vedere solo i propri report, il technical può vedere i report assegnati
        const isReportOwner = report.userId === userId;
        const isAssignedTechnical = report.assignedToId === userId;
        if (!isReportOwner && !isAssignedTechnical) {
            throw new errors_1.ForbiddenError("You are not authorized to view this conversation");
        }
        const messages = yield reportMessageRepository.findByReportId(reportId);
        return messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            senderId: m.senderId,
        }));
    });
}
