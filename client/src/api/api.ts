import type { LoginResponse, SessionInfo } from "../../../shared/LoginTypes";
import type {
  SignupFormData,
  SignupResponse,
} from "../../../shared/SignupTypes";
import type {
  MunicipalityUserRequest,
  MunicipalityUserResponse,
} from "../../../shared/MunicipalityUserTypes";
import type { 
  CreateReportResponse 
} from "../../../shared/ReportTypes";
import type { Report } from "../types/report.types";

const API_PREFIX = import.meta.env.VITE_API_URL || "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (res.ok) return data as T;
  const err =
    (data && (data.message || data.error)) ||
    res.statusText ||
    "Request failed";
  throw new Error(err);
}

export async function getSession(): Promise<SessionInfo> {
  const res = await fetch(`${API_PREFIX}/session/current`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<SessionInfo>(res);
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_PREFIX}/session`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_PREFIX}/session/current`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<unknown>(res);
}

export async function signup(form: SignupFormData): Promise<SignupResponse> {
  const res = await fetch(`${API_PREFIX}/citizen/signup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return handleResponse<SignupResponse>(res);
}

// ADMINISTRATION API

export async function createMunicipalityUser(
  data: MunicipalityUserRequest
): Promise<MunicipalityUserResponse> {
  const res = await fetch(`${API_PREFIX}/admin/municipality-users`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<MunicipalityUserResponse>(res);
}

export async function listMunicipalityUsers(): Promise<
  MunicipalityUserResponse[]
> {
  const res = await fetch(`${API_PREFIX}/admin/municipality-users`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<MunicipalityUserResponse[]>(res);
}

export async function deleteMunicipalityUser(userId: number): Promise<void> {
  const res = await fetch(`${API_PREFIX}/admin/municipality-users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse<unknown>(res);
}

//types for REPORT API

//type received from server
//this type is not in the shared folder because it's only used client-side
//REPORT API functions

export async function createReport(
  reportData: FormData
): Promise<CreateReportResponse> { 
  const res = await fetch(`${API_PREFIX}/reports`, {
    method: "POST",
    credentials: "include",
    body: reportData,
  });
  return handleResponse<CreateReportResponse>(res); 
}


export async function getReports(): Promise<Report[]> {
  const res = await fetch(`${API_PREFIX}/reports`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<Report[]>(res);
}

export async function updateReportStatus(
  reportId: number,
  status: string,
  rejectionReason?: string
): Promise<void> {
  const body = { status, rejectionReason };
  
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/status`, {
    method: "PATCH", // or PUT depending on your backend
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to update report status");
  }
}

export default {
  getSession,
  login,
  logout,
  signup,
  createMunicipalityUser,
  listMunicipalityUsers,
  createReport,
  getReports,
  deleteMunicipalityUser
};