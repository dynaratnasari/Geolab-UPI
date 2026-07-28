import "server-only";

/** Absolute base URL for building links that must work outside the browser context (QR
 *  codes, emails) — prefers an explicit override, falls back to Vercel's own runtime env,
 *  and finally to localhost for dev. */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
