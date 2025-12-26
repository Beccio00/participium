// =========================
// IMPORTS
// =========================

// DTOs and interfaces
import { ReportMessageDTO } from "../interfaces/ReportDTO";
import { Role } from "../../../shared/RoleTypes";

// Repositories
import { ReportRepository } from "../repositories/ReportRepository";
import { ReportMessageRepository } from "../repositories/ReportMessageRepository";

// Services and utilities
import { notifyNewMessage } from "./notificationService";
import { NotFoundError, ForbiddenError } from "../utils/errors";

// =========================
// REPOSITORY INSTANCES
// =========================

const reportRepository = new ReportRepository();
const reportMessageRepository = new ReportMessageRepository();

// =========================
// HELPER FUNCTIONS
// =========================
const getRolesAsArray = (roleData:any): Role[] =>{
  if(Array.isArray(roleData)){
    return roleData as Role[];
  }
  return [roleData as Role];
}

// =========================
// MESSAGE FUNCTIONS
// =========================

// Helper functions for sendMessageToCitizen
function validateUserCanSendMessage(
  report: any,
  userId: number,
  isInternalTech: boolean,
  isExternalTech: boolean
): void {
  const isCitizenOwner = report.userId === userId;
  const senderRole =
    report.user && report.user.id === userId
      ? getRolesAsArray(report.user.role)
      : undefined;
    
      const isCitizen = senderRole ? senderRole.includes(Role.CITIZEN) : false;
  if (
    !isInternalTech &&
    !isExternalTech &&
    !(isCitizenOwner && isCitizen)
  ) {
    throw new ForbiddenError("You are not assigned to this report");
  }
}

function getCitizenSenderName(report: any): string {
  return `${report.user?.first_name ?? "Citizen"} ${report.user?.last_name ?? ""}`.trim();
}

function getTechnicalSenderName(report: any, isInternalTech: boolean, isExternalTech: boolean): string {
  if (isInternalTech && report.assignedOfficer) {
    return `${report.assignedOfficer.first_name} ${report.assignedOfficer.last_name} (Technical)`;
  }
  
  if (isExternalTech && report.externalMaintainer) {
    return `${report.externalMaintainer.first_name} ${report.externalMaintainer.last_name} (External Maintainer)`;
  }
  
  return "Technical Staff";
}

async function notifyCitizenMessage(report: any): Promise<void> {
  const recipientId = report.externalMaintainerId ?? report.assignedOfficerId;
  if (recipientId) {
    const citizenName = getCitizenSenderName(report);
    await notifyNewMessage(report.id, recipientId, citizenName);
  }
}

async function notifyTechnicalMessage(
  report: any,
  isInternalTech: boolean,
  isExternalTech: boolean
): Promise<void> {
  const senderName = getTechnicalSenderName(report, isInternalTech, isExternalTech);
  await notifyNewMessage(report.id, report.userId, senderName);
}

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
  const isCitizenOwner = report.userId === technicalUserId;

  validateUserCanSendMessage(report, technicalUserId, isInternalTech, isExternalTech);

  const savedMessage = await reportMessageRepository.create({
    content,
    reportId,
    senderId: technicalUserId,
  });

  // Inoltra la notifica al destinatario corretto in base al mittente
  if (isCitizenOwner) {
    await notifyCitizenMessage(report);
  } else {
    await notifyTechnicalMessage(report, isInternalTech, isExternalTech);
  }

  return {
    id: savedMessage.id,
    content: savedMessage.content,
    createdAt: savedMessage.createdAt.toISOString(),
    senderId: savedMessage.senderId,
    senderRoles: getRolesAsArray(savedMessage.user.role),
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
    senderRoles: getRolesAsArray(m.user.role),
  }));
}
