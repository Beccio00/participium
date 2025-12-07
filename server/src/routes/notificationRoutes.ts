import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { requireCitizenOrTechnical } from '../middlewares/routeProtection';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', requireCitizenOrTechnical, asyncHandler(getUserNotifications));

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', requireCitizenOrTechnical, asyncHandler(markNotificationAsRead));

export default router;
