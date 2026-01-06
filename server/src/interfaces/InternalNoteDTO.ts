import { InternalNote } from "../entities/InternalNote";
import { Role } from "../../../shared/RoleTypes";

export interface InternalNoteDTO {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorRole: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export function toInternalNoteDTO(internalNote: InternalNote): InternalNoteDTO {
  const roles = Array.isArray(internalNote.author.role) ? internalNote.author.role : [internalNote.author.role as unknown as Role];
  return {
    id: internalNote.id,
    content: internalNote.content,
    authorId: internalNote.authorId,
    authorName: `${internalNote.author.first_name} ${internalNote.author.last_name}`,
    authorRole: roles,
    createdAt: internalNote.createdAt,
    updatedAt: internalNote.updatedAt,
  };
}