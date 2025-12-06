export enum ReportCategory {
  WATER_SUPPLY_DRINKING_WATER = "WATER_SUPPLY_DRINKING_WATER",
  ARCHITECTURAL_BARRIERS = "ARCHITECTURAL_BARRIERS",
  SEWER_SYSTEM = "SEWER_SYSTEM",
  PUBLIC_LIGHTING = "PUBLIC_LIGHTING",
  WASTE = "WASTE",
  ROAD_SIGNS_TRAFFIC_LIGHTS = "ROAD_SIGNS_TRAFFIC_LIGHTS",
  ROADS_URBAN_FURNISHINGS = "ROADS_URBAN_FURNISHINGS",
  PUBLIC_GREEN_AREAS_PLAYGROUNDS = "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
  OTHER = "OTHER"
}

export enum ReportStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ASSIGNED = "ASSIGNED",
  EXTERNAL_ASSIGNED = "EXTERNAL_ASSIGNED",
  REJECTED = "REJECTED",
  IN_PROGRESS = "IN_PROGRESS",
  SUSPENDED = "SUSPENDED",
  RESOLVED = "RESOLVED"
}

export enum NotificationType {
  REPORT_STATUS_CHANGED = "REPORT_STATUS_CHANGED",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  REPORT_ASSIGNED = "REPORT_ASSIGNED",
  REPORT_APPROVED = "REPORT_APPROVED",
  REPORT_REJECTED = "REPORT_REJECTED",
}

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  photos: ReportPhoto[];
}

export interface ReportPhoto {
  id: number;
  url: string;
  filename: string;
}

export interface CreateReportResponse {
  id: number;
  message: string;
}

// Story 6 interfaces
export interface RejectReportRequest {
  reason: string;
}