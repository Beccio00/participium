export type ReportCategory =
  | "WATER_SUPPLY_DRINKING_WATER"
  | "ARCHITECTURAL_BARRIERS"
  | "SEWER_SYSTEM"
  | "PUBLIC_LIGHTING"
  | "WASTE"
  | "ROAD_MAINTENANCE"
  | "GREEN_AREAS"
  | "PUBLIC_TRANSPORT"
  | "OTHER";

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
}

export interface CreateReportResponse {
  id: number;
  message: string;
}
