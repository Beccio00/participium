// Client-specific report types
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportCategory,
  ReportPhoto,
  ReportStatus,
} from "../../../shared/ReportTypes";

import type{
  InternalNote,
  CreateInternalNoteRequest,
  CreateInternalNoteResponse
}from "../../../shared/InternalNotes";

// Extended Report interface with optional fields for client display
export interface Report {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  status: string; // Can be ReportStatus or custom display strings like "In Progress"
  address: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  photos?: ReportPhoto[];
  isAnonymous?: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

// Re-export shared report types
export type { CreateReportRequest, CreateReportResponse,InternalNote, CreateInternalNoteRequest, CreateInternalNoteResponse, ReportCategory, ReportPhoto, ReportStatus };
