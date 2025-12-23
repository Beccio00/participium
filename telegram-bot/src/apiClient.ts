import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

export async function callBackend(): Promise<string> { 
  const res = await axios.get(`${API_BASE_URL}/health`);
  return res.data.status;
}

export async function linkTelegramAccount(
  token: string,
  telegramId: string,
  telegramUsername?: string
): Promise<{ success: boolean; message: string }> {
  const res = await axios.post(`${API_BASE_URL}/telegram/link`, {
    token,
    telegramId,
    telegramUsername: telegramUsername || null,
  });
  return res.data;
}
