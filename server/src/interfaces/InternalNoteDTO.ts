/**
 * DTO interfaces for Internal Notes (PT26)
 * Internal notes are used for coordination between technical staff
 * and are NOT visible to citizens
 */

export interface InternalNoteDTO {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInternalNoteDTO {
  content: string;
}
