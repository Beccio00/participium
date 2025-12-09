import { Request, Response } from "express";
import {
  sendMessageToCitizen as sendMessageToCitizenService,
  getReportMessages as getReportMessagesService,
} from "../services/messageService";
import { BadRequestError } from "../utils";

// Send message to citizen
export async function sendMessageToCitizen(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };
  const { content } = req.body;

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new BadRequestError("Message content is required");
  }

  const message = await sendMessageToCitizenService(reportId, user.id, content);
  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
}

// Get report conversation history
export async function getReportMessages(req: Request, res: Response): Promise<void> {
  const reportId = parseInt(req.params.reportId);
  const user = req.user as { id: number };

  if (isNaN(reportId)) {
    throw new BadRequestError("Invalid report ID parameter");
  }

  const messages = await getReportMessagesService(reportId, user.id);
  res.status(200).json(messages);
}