import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizen } from '../middlewares/routeProtection';
import { validateTurinBoundaries } from '../middlewares/validateTurinBoundaries';
import { createReport, getReports } from '../controllers/reportController';
import { upload } from '../middlewares/uploadsMiddleware';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';

const router = Router();

// POST /api/reports (ATTENTION: the validator is skipped for this route)
router.post('/', requireCitizen, upload.array('photos', 3), validateTurinBoundaries, asyncHandler(createReport));

// GET /api/reports 
router.get('/', ApiValidationMiddleware, asyncHandler(getReports));

export default router;