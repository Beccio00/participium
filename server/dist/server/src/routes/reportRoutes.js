"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const routeProtection_1 = require("../middlewares/routeProtection");
const validateTurinBoundaries_1 = require("../middlewares/validateTurinBoundaries");
const reportController_1 = require("../controllers/reportController");
const uploadsMiddleware_1 = require("../middlewares/uploadsMiddleware");
const validationMiddlewere_1 = require("../middlewares/validationMiddlewere");
const router = (0, express_1.Router)();
// POST /api/reports (ATTENTION: the validator is skipped for this route)
router.post("/", routeProtection_1.requireCitizen, uploadsMiddleware_1.upload.array("photos", 3), validateTurinBoundaries_1.validateTurinBoundaries, (0, errorMiddleware_1.asyncHandler)(reportController_1.createReport));
// GET /api/reports
router.get("/", validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.getReports));
// GET /api/reports/assigned - Get reports assigned to the authenticated technical officer
const reportController_2 = require("../controllers/reportController");
router.get("/assigned", (0, errorMiddleware_1.asyncHandler)(reportController_2.getAssignedReports));
// GET /api/reports/pending - Get pending reports for review
router.get("/pending", routeProtection_1.requirePublicRelations, (0, errorMiddleware_1.asyncHandler)(reportController_1.getPendingReports));
// POST /api/reports/:reportId/approve - Approve a report
router.post('/:reportId/approve', routeProtection_1.requirePublicRelations, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.approveReport));
// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', routeProtection_1.requirePublicRelations, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.rejectReport));
// PATCH /api/reports/:reportId/status - Update report status
router.patch('/:reportId/status', routeProtection_1.requireTechnicalStaff, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.updateReportStatus));
// POST /api/reports/:reportId/messages - Send message to citizen
router.post('/:reportId/messages', routeProtection_1.requireTechnicalStaff, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.sendMessageToCitizen));
// GET /api/reports/:reportId/messages - Get report conversation history
router.get('/:reportId/messages', routeProtection_1.isLoggedIn, validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)(reportController_1.getReportMessages));
// GET /api/reports/:reportId/assignable-technicals - list technicals valid for this report
router.get("/:reportId/assignable-technicals", routeProtection_1.requirePublicRelations, (0, errorMiddleware_1.asyncHandler)(reportController_1.getAssignableTechnicals));
exports.default = router;
