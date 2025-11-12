import { Router } from 'express';
import { createReport, getReports } from '../controllers/reportController';
import { isLoggedIn } from '../middleware/routeProtection';

const router = Router();

router.post('/reports', isLoggedIn, createReport);
router.get('/reports', isLoggedIn,  getReports);

export default router;