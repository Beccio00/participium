import { Router } from 'express';
import { createReport, getReports } from '../controllers/reportController';
import { isLoggedIn } from '../middleware/routeProtection';
import { upload } from '../middleware/uploadsMiddleware';

const router = Router();

router.post('/', isLoggedIn, upload.array('photos', 3), createReport);
router.get('/', isLoggedIn, getReports);

export default router;