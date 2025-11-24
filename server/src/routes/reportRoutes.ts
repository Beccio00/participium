import { Router } from 'express';
import { requireCitizen, requirePublicRelations } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { 
  createReport, 
  getReports, 
  getPendingReports, 
  approveReport, 
  rejectReport,
  getAssignableTechnicals,
} from '../controllers/reportController';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';

const router = Router();

// POST /api/reports - Create a new report (citizens only)
router.post('/', requireCitizen, validateTurinBoundaries, createReport);

// GET /api/reports - Get approved reports (public access)
router.get('/', getReports, ApiValidationMiddleware);

// GET /api/reports/pending - Get pending reports for review
router.get('/pending', requirePublicRelations, getPendingReports, ApiValidationMiddleware);

// GET /api/reports/:reportId/assignable-technicals - list technicals available for this report's category
router.get('/:reportId/assignable-technicals', requirePublicRelations, getAssignableTechnicals, ApiValidationMiddleware);

// POST /api/reports/:reportId/approve - Approve a report
router.post('/:reportId/approve', requirePublicRelations, approveReport,  ApiValidationMiddleware);

// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', requirePublicRelations, rejectReport, ApiValidationMiddleware);

export default router;