import { InternalNoteRepository } from "../repositories/InternalNoteRepository";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { Role } from "../entities/User";

const internalNoteRepository = new InternalNoteRepository();
const reportRepository = new ReportRepository();
const userRepository = new UserRepository();

/**
 * Technical staff roles that can create and view internal notes
 */
const TECHNICAL_STAFF_ROLES = [
  Role.ADMINISTRATOR,
  Role.MUNICIPAL_BUILDING_MAINTENANCE,
  Role.PRIVATE_BUILDINGS,
  Role.INFRASTRUCTURES,
  Role.GREENSPACES_AND_ANIMAL_PROTECTION,
  Role.WASTE_MANAGEMENT,
  Role.ROAD_MAINTENANCE,
  Role.CIVIL_PROTECTION,
  Role.CULTURE_EVENTS_TOURISM_SPORTS,
  Role.LOCAL_PUBLIC_SERVICES,
  Role.EDUCATION_SERVICES,
  Role.PUBLIC_RESIDENTIAL_HOUSING,
  Role.INFORMATION_SYSTEMS,
];

/**
 * Check if a user has permission to access internal notes
 */
function isTechnicalStaff(role: Role): boolean {
  return TECHNICAL_STAFF_ROLES.includes(role);
}

/**
 * Create a new internal note for a report
 * Only technical staff can create internal notes
 */
export async function createInternalNote(
  reportId: number,
  content: string,
  authorId: number,
  authorRole: Role
): Promise<{
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  // Validate that the user is technical staff
  if (!isTechnicalStaff(authorRole)) {
    throw new ForbiddenError("Only technical staff can create internal notes");
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new BadRequestError("Content is required");
  }

  if (content.length > 2000) {
    throw new BadRequestError("Content cannot exceed 2000 characters");
  }

  // Check if report exists
  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // Get author information
  const author = await userRepository.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  // Create the internal note
  const note = await internalNoteRepository.create({
    content: content.trim(),
    reportId,
    authorId,
  });

  // Return the note with author information
  return {
    id: note.id,
    content: note.content,
    authorId: note.authorId,
    authorName: `${author.first_name} ${author.last_name}`,
    authorRole: author.role,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}


