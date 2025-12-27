import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;


export async function linkTelegramAccount(
  token: string,
  telegramId: string,
  telegramUsername?: string
): Promise<{ success: boolean; message: string }> {
  const res = await axios.post(`${API_BASE_URL}/api/telegram/link`, {
    token,
    telegramId,
    telegramUsername: telegramUsername || null,
  });
  return res.data;
}

export interface CreateReportData {
  telegramId: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  isAnonymous?: boolean;
  photoFileIds?: string[];
}

export interface CreateReportResponse {
  success: boolean;
  message: string;
  reportId: number;
}

export async function createReport(data: CreateReportData): Promise<CreateReportResponse> {
  const res = await axios.post(`${API_BASE_URL}/api/telegram/reports`, data);
  return res.data;
}

export async function getMyReports(telegramId: string): Promise<any> {
  const res = await axios.get(`${API_BASE_URL}/api/telegram/users/${telegramId}/reports`, {
    params: { telegramId },
  });
  return res.data;
}

export async function getReportStatus(telegramId: string, reportId: number): Promise<any> {
  const res = await axios.get(`${API_BASE_URL}/api/telegram/users/${telegramId}/reports/${reportId}`);
  return res.data;
}
