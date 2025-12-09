import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizenOrTechnicalOrExternal } from '../middlewares/routeProtection';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', requireCitizenOrTechnicalOrExternal, asyncHandler(getUserNotifications));

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', requireCitizenOrTechnicalOrExternal, asyncHandler(markNotificationAsRead));

export default router;
