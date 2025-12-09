// =========================
// IMPORTS
// =========================

// DTOs and interfaces
import { ReportMessageDTO } from "../interfaces/ReportDTO";

// Repositories
import { ReportRepository } from "../repositories/ReportRepository";
import { ReportMessageRepository } from "../repositories/ReportMessageRepository";

// Services and utilities
import { notifyNewMessage } from "./notificationService";
import {
  NotFoundError,
  ForbiddenError,
} from "../utils/errors";

// =========================
// REPOSITORY INSTANCES
// =========================

const reportRepository = new ReportRepository();
const reportMessageRepository = new ReportMessageRepository();

// =========================
// MESSAGE FUNCTIONS
// =========================

/**
 * Invia un messaggio al cittadino (solo technical o esterno)
 */
export async function sendMessageToCitizen(
  reportId: number,
  technicalUserId: number,
  content: string
): Promise<ReportMessageDTO> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const isInternalTech = report.assignedOfficerId === technicalUserId;
  const isExternalTech = report.externalMaintainerId === technicalUserId;

  // Verifica che il technical sia assegnato a questo report
  if (!isInternalTech && !isExternalTech) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const savedMessage = await reportMessageRepository.create({
    content,
    reportId,
    senderId: technicalUserId,
  });

  let senderName = "";
  // Notifica il cittadino del nuovo messaggio
  if (report.assignedOfficer){
    senderName = `${report.assignedOfficer?.first_name} ${report.assignedOfficer?.last_name} (Technical)`;
  } else if (report.externalMaintainer){
    senderName = `${report.externalMaintainer?.first_name} ${report.externalMaintainer?.last_name} (External Maintainer)`;
  } else {
    senderName = "Technical Staff";
  }
  await notifyNewMessage(report.id, report.userId, senderName);

  return {
    id: savedMessage.id,
    content: savedMessage.content,
    createdAt: savedMessage.createdAt.toISOString(),
    senderId: savedMessage.senderId,
    senderRole: savedMessage.user.role,
  };
}

/**
 * Ottieni tutti i messaggi di un report (cittadino, technical o esterno)
 */
export async function getReportMessages(
  reportId: number,
  userId: number
): Promise<ReportMessageDTO[]> {
  const report = await reportRepository.findByIdWithRelations(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const isReportOwner = report.userId === userId;
  const isAssignedTechnical = report.assignedOfficerId === userId;
  const isExternalMaintainer = report.externalMaintainerId === userId;

  if (!isReportOwner && !isAssignedTechnical && !isExternalMaintainer) {
    throw new ForbiddenError(
      "You are not authorized to view this conversation"
    );
  }

  const messages = await reportMessageRepository.findByReportId(reportId);

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    senderRole: m.user.role,
  }));
}