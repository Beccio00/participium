import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { isLoggedIn } from '../middlewares/routeProtection';
import { ApiValidationMiddleware } from '../middlewares/validationMiddlewere';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', isLoggedIn, ApiValidationMiddleware, asyncHandler(getUserNotifications));

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', isLoggedIn, ApiValidationMiddleware, asyncHandler(markNotificationAsRead));

export default router;
