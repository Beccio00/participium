import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { isLoggedIn } from '../middlewares/routeProtection';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', isLoggedIn, asyncHandler(getUserNotifications));

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', isLoggedIn, asyncHandler(markNotificationAsRead));

export default router;
