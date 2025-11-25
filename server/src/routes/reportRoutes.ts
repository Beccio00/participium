import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizen } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { createReport, getReports, getPendingReports, approveReport, rejectReport } from '../controllers/reportController';
import { upload } from '../middlewares/uploadsMiddleware';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';
import { requirePublicRelations } from '../middlewares/routeProtection';

const router = Router();


// POST /api/reports (ATTENTION: the validator is skipped for this route)
router.post('/', requireCitizen, upload.array('photos', 3), validateTurinBoundaries, asyncHandler(createReport));

// GET /api/reports 
router.get('/', ApiValidationMiddleware, asyncHandler(getReports));


// GET /api/reports/pending - Get pending reports for review
router.get('/pending', requirePublicRelations, asyncHandler(getPendingReports));

// POST /api/reports/:reportId/approve - Approve a report
router.post('/:reportId/approve', requirePublicRelations, asyncHandler(approveReport));

// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', requirePublicRelations, asyncHandler(rejectReport));

export default router;