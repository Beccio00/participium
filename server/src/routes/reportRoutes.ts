import { Router } from 'express';
import { createReport, getReports } from '../controllers/reportController';
import { isLoggedIn } from '../middleware/routeProtection';

const router = Router();

router.post('/', isLoggedIn, createReport);
router.get('/', isLoggedIn, getReports);

export default router;