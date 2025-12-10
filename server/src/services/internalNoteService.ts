import { InternalNoteRepository } from "../repositories/InternalNoteRepository";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { Role } from "../../../shared/RoleTypes";
import { InternalNoteDTO, toInternalNoteDTO } from "../interfaces/InternalNoteDTO";

const internalNoteRepository = new InternalNoteRepository();
const reportRepository = new ReportRepository();
const userRepository = new UserRepository();

export async function createInternalNote(
  reportId: number,
  content: string,
  authorId: number,
  authorRole: Role
): Promise<InternalNoteDTO> {

  if (content.length > 2000) {
    throw new BadRequestError("Content cannot exceed 2000 characters");
  }

  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError("Report not found");
  }
  
  const isInternalAssigned = report.assignedOfficerId === authorId;
  const isExternalAssigned = report.externalMaintainerId === authorId;

  if (!isInternalAssigned && !isExternalAssigned) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  if (!report.externalCompanyId) {
    throw new BadRequestError("Internal notes are only available for reports assigned to external companies");
  }

  if (report.externalCompanyId && !report.externalMaintainerId) {
    throw new BadRequestError("Internal notes are not available for reports assigned to external companies without platform access");
  }

  const author = await userRepository.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  const note = await internalNoteRepository.create({
    content: content.trim(),
    reportId,
    authorId,
    authorRole
  });

  return toInternalNoteDTO(note);
}

export async function getInternalNotes(reportId: number, userId: number): Promise<InternalNoteDTO[]> {
  const report = await reportRepository.findById(reportId);
 
  if (!report) {
    throw new NotFoundError("Report not found");
  }

  if (!report.externalCompanyId) {
    throw new BadRequestError("Internal notes are only available for reports assigned to external companies");
  }

  if (report.externalCompanyId && !report.externalMaintainerId) {
    throw new BadRequestError("Internal notes are not available for reports assigned to external companies without platform access");
  }

  const isInternalAssigned = report.assignedOfficerId === userId;
  const isExternalAssigned = report.externalMaintainerId === userId;

  if (!isInternalAssigned && !isExternalAssigned) {
    throw new ForbiddenError("You are not assigned to this report");
  }

  const notes = await internalNoteRepository.findByReportId(reportId);
  return notes.map(note => toInternalNoteDTO(note));
}


