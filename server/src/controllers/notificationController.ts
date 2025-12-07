import { Request, Response } from "express";
import { BadRequestError } from "../utils/errors";
import {
  getUserNotifications as getUserNotificationsService,
  markNotificationAsRead as markNotificationAsReadService,
} from "../services/notificationService";

export async function getUserNotifications(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const { unreadOnly, limit } = req.query;

  const unreadOnlyBool = unreadOnly === "true";
  const limitNum = limit ? parseInt(limit as string) : undefined;

  if (limit && isNaN(limitNum!)) {
    throw new BadRequestError("Invalid limit parameter");
  }

  const notifications = await getUserNotificationsService(
    user.id,
    unreadOnlyBool,
    limitNum
  );

  res.status(200).json(notifications);
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const notificationId = parseInt(req.params.notificationId);

  if (isNaN(notificationId)) {
    throw new BadRequestError("Invalid notification ID parameter");
  }

  const notification = await markNotificationAsReadService(notificationId, user.id);
  res.status(200).json({
    message: "Notification marked as read",
    notification,
  });
}
