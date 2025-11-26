import type { Report } from "../types/report.types";

export type ChatMessage = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

export type ChatConversation = {
  report: Report;
  messages: ChatMessage[];
};

export async function getReportMessages(
  reportId: number
): Promise<ChatMessage[]> {
  const res = await fetch(`/api/reports/${reportId}/messages`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data;
}

export async function sendReportMessage(
  reportId: number,
  content: string
): Promise<ChatMessage> {
  const res = await fetch(`/api/reports/${reportId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  return data.data;
}
