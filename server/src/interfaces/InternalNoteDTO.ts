import { InternalNote } from "../entities/InternalNote";

export interface InternalNoteDTO {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toInternalNoteDTO(internalNote: InternalNote): InternalNoteDTO {
  return {
    id: internalNote.id,
    content: internalNote.content,
    authorId: internalNote.authorId,
    authorName: `${internalNote.author.first_name} ${internalNote.author.last_name}`,
    authorRole: internalNote.author.role,
    createdAt: internalNote.createdAt,
    updatedAt: internalNote.updatedAt,
  };
}