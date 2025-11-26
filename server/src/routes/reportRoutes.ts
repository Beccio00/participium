import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizen, requirePublicRelations, requireTechnicalStaff, isLoggedIn } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { 
  createReport, 
  getReports, 
  getPendingReports, 
  approveReport, 
  rejectReport,
  getAssignableTechnicals,
  updateReportStatus,
  sendMessageToCitizen,
  getReportMessages
} from '../controllers/reportController';
import { upload } from '../middlewares/uploadsMiddleware';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';

const router = Router();


// POST /api/reports (ATTENTION: the validator is skipped for this route)
router.post('/', requireCitizen, upload.array('photos', 3), validateTurinBoundaries, asyncHandler(createReport));

// GET /api/reports 
router.get('/', ApiValidationMiddleware, asyncHandler(getReports));


// GET /api/reports/pending - Get pending reports for review
router.get('/pending', requirePublicRelations, asyncHandler(getPendingReports));

// POST /api/reports/:reportId/approve - Approve a report
router.post('/:reportId/approve', requirePublicRelations, ApiValidationMiddleware, asyncHandler(approveReport));

// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', requirePublicRelations, ApiValidationMiddleware, asyncHandler(rejectReport));

// PATCH /api/reports/:reportId/status - Update report status
router.patch('/:reportId/status', requireTechnicalStaff, ApiValidationMiddleware, asyncHandler(updateReportStatus));

// POST /api/reports/:reportId/messages - Send message to citizen
router.post('/:reportId/messages', requireTechnicalStaff, ApiValidationMiddleware, asyncHandler(sendMessageToCitizen));

// GET /api/reports/:reportId/messages - Get report conversation history
router.get('/:reportId/messages', isLoggedIn, ApiValidationMiddleware, asyncHandler(getReportMessages));

// GET /api/reports/:reportId/assignable-technicals - list technicals valid for this report
router.get('/:reportId/assignable-technicals', requirePublicRelations, asyncHandler(getAssignableTechnicals));

export default router;