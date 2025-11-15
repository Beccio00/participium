// Central export for all client-side types
// Re-export from shared folder
export type {
  User,
  LoginFormData,
  LoginResponse,
  SessionInfo,
  ErrorResponse,
  ValidationResult,
} from "../../../shared/LoginTypes";

export type {
  SignupFormData,
  SignupResponse,
  SignupFormErrors,
  SignupValidationResult,
} from "../../../shared/SignupTypes";

export type { AuthUser, AuthContextType } from "../../../shared/AuthTypes";

export type {
  MunicipalityUserRequest,
  MunicipalityUserResponse,
} from "../../../shared/MunicipalityUserTypes";

export type {
  CreateReportRequest,
  CreateReportResponse,
} from "../../../shared/ReportTypes";

// Export client-specific types
export * from "./ui.types";
export * from "./report.types";
