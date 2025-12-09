// Notification API
export async function getNotifications(): Promise<any[]> {
  const res = await fetch(`${API_PREFIX}/notifications`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<any[]>(res);
}
import type { LoginResponse, SessionInfo } from "../../../shared/LoginTypes";
import type {
  SignupFormData,
  SignupResponse,
} from "../../../shared/SignupTypes";
import type {
  MunicipalityUserRequest,
  MunicipalityUserResponse,
} from "../../../shared/MunicipalityUserTypes";
import type { CreateReportResponse } from "../../../shared/ReportTypes";
import type { Report } from "../types/report.types";
import type {
  AssignReportToExternalResponse,
  CreateExternalMaintainerData,
  CreateExternalCompanyData,
  ExternalCompanyResponse,
  ExternalMaintainerResponse,
} from "../../../shared/ExternalTypes";

const API_PREFIX = import.meta.env.VITE_API_URL || "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }
  if (res.ok) return data as T;
  const message =
    (data && (data.message || data.error)) ||
    res.statusText ||
    "Request failed";
  const err = new Error(message);
  (err as any).status = res.status;
  (err as any).body = data;
  throw err;
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

// ADMINISTRATION API -(municipality users)

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
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<unknown>(res);
}

// ADMINISTRATION API -(external company)

// company

export async function createExternalCompany(
  data: CreateExternalCompanyData
): Promise<ExternalCompanyResponse> {
  const res = await fetch(`${API_PREFIX}/admin/external-companies`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ExternalCompanyResponse>(res);
}

export async function getExternalCompanies(): Promise<
  ExternalCompanyResponse[]
> {
  const res = await fetch(`${API_PREFIX}/admin/external-companies`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ExternalCompanyResponse[]>(res);
}

export async function getExternalCompaniesWithAccess(): Promise<
  ExternalCompanyResponse[]
> {
  const res = await fetch(
    `${API_PREFIX}/admin/external-companies/platform-access`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return handleResponse<ExternalCompanyResponse[]>(res);
}

export async function deleteExternalCompany(companyId: number): Promise<void> {
  const res = await fetch(
    `${API_PREFIX}/admin/external-companies/${companyId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  await handleResponse<unknown>(res);
}

// maintainers

export async function createExternalMaintainer(
  data: CreateExternalMaintainerData
): Promise<ExternalMaintainerResponse> {
  const res = await fetch(`${API_PREFIX}/admin/external-maintainers`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ExternalMaintainerResponse>(res);
}

export async function getExternalMaintainers(): Promise<
  ExternalMaintainerResponse[]
> {
  const res = await fetch(`${API_PREFIX}/admin/external-maintainers`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ExternalMaintainerResponse[]>(res);
}

export async function getExternalMaintainer(
  maintainerId: number
): Promise<ExternalMaintainerResponse> {
  const res = await fetch(
    `${API_PREFIX}/admin/external-maintainers/${maintainerId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return handleResponse<ExternalMaintainerResponse>(res);
}

export async function deleteExternalMaintainer(
  maintainerId: number
): Promise<void> {
  const res = await fetch(
    `${API_PREFIX}/admin/external-maintainers/${maintainerId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
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

// CITIZEN PROFILE API
export async function getCitizenProfile() {
  const res = await fetch(`${API_PREFIX}/citizen/me`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<any>(res);
}

export async function updateCitizenConfig(data: Record<string, any>) {
  const res = await fetch(`${API_PREFIX}/citizen/me`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function uploadCitizenPhoto(formData: FormData) {
  const res = await fetch(`${API_PREFIX}/citizen/me/photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<any>(res);
}

export async function deleteCitizenPhoto() {
  const res = await fetch(`${API_PREFIX}/citizen/me/photo`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<any>(res);
}

export async function getPendingReports(): Promise<Report[]> {
  const res = await fetch(`${API_PREFIX}/reports/pending`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<Report[]>(res);
}

export async function getAssignableTechnicals(
  reportId: number
): Promise<any[]> {
  const res = await fetch(
    `${API_PREFIX}/reports/${reportId}/assignable-technicals`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return handleResponse<any[]>(res);
}

export async function getAssignableExternals(reportId: number): Promise<any[]> {
  const res = await fetch(
    `${API_PREFIX}/reports/${reportId}/assignable-externals`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return handleResponse<any[]>(res);
}

export async function assignReportToExternal(
  reportId: number,
  externalCompanyId: number,
  externalMaintainerId: number | null = null
): Promise<any> {
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/assign-external`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ externalCompanyId, externalMaintainerId }),
  });
  return handleResponse<AssignReportToExternalResponse>(res);
}

export async function approveReport(
  reportId: number,
  assignedTechnicalId: number
): Promise<any> {
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/approve`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedTechnicalId }),
  });
  return handleResponse<any>(res);
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

export async function rejectReport(
  reportId: number,
  reason: string
): Promise<any> {
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<any>(res);
}

export async function getAssignedReports(): Promise<Report[]> {
  const res = await fetch(`${API_PREFIX}/reports/assigned`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<Report[]>(res);
}

// Send message to citizen (external maintainer/technical)
export async function sendReportMessage(
  reportId: number,
  content: string
): Promise<void> {
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to send message");
  }
}

// Get all messages for a report
export async function getReportMessages(reportId: number): Promise<any[]> {
  const res = await fetch(`${API_PREFIX}/reports/${reportId}/messages`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch messages");
  }
  return await res.json();
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
  getPendingReports,
  getAssignableTechnicals,
  approveReport,
  rejectReport,
  getCitizenProfile,
  updateCitizenConfig,
  uploadCitizenPhoto,
  deleteCitizenPhoto,
  deleteMunicipalityUser,
  getNotifications,
};
