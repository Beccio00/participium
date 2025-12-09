import { Router } from 'express';
import {query} from 'express-validator';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizen, requirePublicRelations, requireTechnicalStaffOnly, requireTechnicalOrExternal, isLoggedIn } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { 
  createReport, 
  getReports, 
  getReportById,
  getPendingReports, 
  approveReport, 
  rejectReport,
  getAssignableTechnicals,
  updateReportStatus,
  getAssignedReports
} from '../controllers/reportController';
import {
  sendMessageToCitizen,
  getReportMessages,
} from '../controllers/messageController';
import { getAssignableExternals, assignReportToExternal } from '../controllers/externalController';
import { upload } from '../middlewares/uploadsMiddleware';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';

const router = Router();

// POST /api/reports (ATTENTION: the validator is skipped for this route)
router.post(
  "/",
  requireCitizen,
  upload.array("photos", 3),
  validateTurinBoundaries,
  asyncHandler(createReport)
);

// GET /api/reports
router.get("/", ApiValidationMiddleware, asyncHandler(getReports));

// GET /api/reports/assigned - Get reports assigned to the authenticated technical officer or external maintainer
router.get("/assigned", requireTechnicalOrExternal, ApiValidationMiddleware, asyncHandler(getAssignedReports));

// GET /api/reports/pending - Get pending reports for review
router.get("/pending", requirePublicRelations, ApiValidationMiddleware, asyncHandler(getPendingReports));

// GET /api/reports/:reportId - Get single report details
router.get("/:reportId", isLoggedIn, ApiValidationMiddleware, asyncHandler(getReportById));

// GET /api/reports/:reportId/assignable-technicals - list municipality technicals valid for this report (no externals)
router.get("/:reportId/assignable-technicals", requirePublicRelations, ApiValidationMiddleware, asyncHandler(getAssignableTechnicals));

// GET /api/reports/:reportId/assignable-externals - list external companies and maintainers (municipality staff only)
router.get("/:reportId/assignable-externals", requireTechnicalStaffOnly, ApiValidationMiddleware, asyncHandler(getAssignableExternals));

// GET /api/reports/:reportId/messages - Get report conversation history
router.get('/:reportId/messages', isLoggedIn, ApiValidationMiddleware, asyncHandler(getReportMessages));

// POST /api/reports/:reportId/approve - Approve a report (Public Relations only)
router.post('/:reportId/approve', requirePublicRelations, ApiValidationMiddleware, asyncHandler(approveReport));

// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', requirePublicRelations, ApiValidationMiddleware, asyncHandler(rejectReport));

// PATCH /api/reports/:reportId/status - Update report status (technical staff and external maintainers)
router.patch('/:reportId/status', requireTechnicalOrExternal, ApiValidationMiddleware, asyncHandler(updateReportStatus));

// POST /api/reports/:reportId/messages - Send message to citizen (technical staff and external maintainers)
router.post('/:reportId/messages', requireTechnicalOrExternal, ApiValidationMiddleware, asyncHandler(sendMessageToCitizen));

// POST /api/reports/:reportId/assign-external - assign to external maintainer or company (municipality staff only)
router.post("/:reportId/assign-external", requireTechnicalStaffOnly, ApiValidationMiddleware, asyncHandler(assignReportToExternal));

export default router;
