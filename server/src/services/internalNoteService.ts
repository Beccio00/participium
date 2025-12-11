import { InternalNoteRepository } from "../repositories/InternalNoteRepository";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { Role } from "../../../shared/RoleTypes";
import { InternalNoteDTO, toInternalNoteDTO } from "../interfaces/InternalNoteDTO";
import { notifyInternalNoteAdded } from "./notificationService";

const internalNoteRepository = new InternalNoteRepository();
const reportRepository = new ReportRepository();
const userRepository = new UserRepository();

export async function createInternalNote(
  reportId: number,
  content: string,
  authorId: number,
  authorRole: Role
): Promise<InternalNoteDTO> {

  if (!content || content.trim().length === 0) {
    throw new BadRequestError("Content is required");
  }

  if (content.length > 2000) {
    throw new BadRequestError("Content cannot exceed 2000 characters");
  }

  const report = await reportRepository.findByIdWithRelations(reportId);
  if (!report) {
    throw new NotFoundError("Report not found");
  }
    
  const isInternalAssigned = report.assignedOfficerId === authorId;
  const isExternalAssigned = report.externalMaintainerId === authorId;

  const author = await userRepository.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  // Only assigned internal officer or assigned external maintainer can create notes
  if (!isInternalAssigned && !isExternalAssigned) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const note = await internalNoteRepository.create({
    content: content.trim(),
    reportId,
    authorId,
    authorRole
  });

  // Notifica l'altro utente assegnato al report (internal o external)
  const recipientId = isExternalAssigned 
    ? report.assignedOfficerId 
    : report.externalMaintainerId;

  if (recipientId) {
    await notifyInternalNoteAdded(
      reportId,
      recipientId,
      author.first_name,
      author.last_name
    );
  }

  return toInternalNoteDTO(note);
}

export async function getInternalNotes(reportId: number, userId: number): Promise<InternalNoteDTO[]> {
  const report = await reportRepository.findByIdWithRelations(reportId);
 
  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const isInternalAssigned = report.assignedOfficerId === userId;
  const isExternalAssigned = report.externalMaintainerId === userId;

  if (!isInternalAssigned && !isExternalAssigned) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const notes = await internalNoteRepository.findByReportId(reportId);
  return notes.map(note => toInternalNoteDTO(note));
}


