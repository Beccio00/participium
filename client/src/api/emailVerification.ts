// Add email verification API calls for citizen registration
import { API_PREFIX } from "./api";

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<void> {
  const res = await fetch(`${API_PREFIX}/citizen/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Verification failed");
  }
}

export async function resendVerificationCode(email: string): Promise<void> {
  console.log("Resending verification code to:", email);
  const res = await fetch(`${API_PREFIX}/citizen/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Resend failed");
  }
}
