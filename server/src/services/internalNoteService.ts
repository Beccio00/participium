import { InternalNoteRepository } from "../repositories/InternalNoteRepository";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { Role } from "../entities/User";
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


  if (!content || content.trim().length === 0) {
    throw new BadRequestError("Content is required");
  }

  if (content.length > 2000) {
    throw new BadRequestError("Content cannot exceed 2000 characters");
  }

  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError("Report not found");
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

  const notes = await internalNoteRepository.findByReportId(reportId);
  return notes.map(note => toInternalNoteDTO(note));
}


