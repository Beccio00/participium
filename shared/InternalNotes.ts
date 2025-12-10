export interface InternalNote {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  createdAt: Date;
  updatedAt: Date;
};
export interface CreateInternalNoteRequest {
    reportId: number;
    authorId: number;
    content: string;
};

export interface CreateInternalNoteResponse{
    id: number;
    content: string;
    authorId: number;
    authorName: string;
    authorRole: string;
    createdAt: Date;
    updatedAt: Date;
}
