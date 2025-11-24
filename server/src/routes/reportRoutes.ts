import { Router } from 'express';
import { requireCitizen, requirePublicRelations } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { 
  createReport, 
  getReports, 
  getPendingReports, 
  approveReport, 
  rejectReport 
} from '../controllers/reportController';

const router = Router();

// POST /api/reports - Create a new report (citizens only)
router.post('/', requireCitizen, validateTurinBoundaries, createReport);

// GET /api/reports - Get approved reports (public access)
router.get('/', getReports);

// GET /api/reports/pending - Get pending reports for review
router.get('/pending', requirePublicRelations, getPendingReports);

// POST /api/reports/:reportId/approve - Approve a report
router.post('/:reportId/approve', requirePublicRelations, approveReport);

// POST /api/reports/:reportId/reject - Reject a report
router.post('/:reportId/reject', requirePublicRelations, rejectReport);

export default router;