// UI-specific types not needed in the backend

export type LoadingState = "idle" | "loading" | "success" | "error";

export type LatLng = [number, number];

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ApiError {
  code: number;
  error: string;
  message: string;
}
