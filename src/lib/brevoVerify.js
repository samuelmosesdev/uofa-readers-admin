/**
 * Client helpers for Academicall Brevo verification (Cloudflare Worker).
 * Set VITE_VERIFY_API_URL in .env.local (no trailing slash).
 * Example: https://academicall-verify.yourname.workers.dev
 */

function baseUrl() {
  const u = import.meta.env.VITE_VERIFY_API_URL || "";
  return u.replace(/\/$/, "");
}

export function isBrevoVerifyConfigured() {
  return Boolean(baseUrl());
}

export async function sendBrevoVerificationCode(idToken) {
  const base = baseUrl();
  if (!base) {
    throw new Error(
      "Verification API not configured. Add VITE_VERIFY_API_URL to .env.local"
    );
  }
  const res = await fetch(`${base}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not send verification code");
  }
  return data;
}

export async function verifyBrevoCode(idToken, code) {
  const base = baseUrl();
  if (!base) {
    throw new Error(
      "Verification API not configured. Add VITE_VERIFY_API_URL to .env.local"
    );
  }
  const res = await fetch(`${base}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, code: String(code).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Verification failed");
  }
  return data;
}
