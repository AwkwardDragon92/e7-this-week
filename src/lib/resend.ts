/** Minimal Resend REST calls. Every function is a no-op when env vars are missing. */
const API = "https://api.resend.com";

export class ResendError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call(path: string, body: unknown) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true as const };
  const res = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ResendError(`Resend ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
  return { skipped: false as const, data: await res.json() };
}

/**
 * Adds a signup to the Resend segment (RESEND_SEGMENT_ID, or legacy RESEND_AUDIENCE_ID).
 * Returns "skipped" when not configured, "no_permission" when the key is sending-only
 * (signups are still stored in Postgres and can be imported later).
 */
export async function addToAudience(email: string) {
  const segment = process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID;
  if (!process.env.RESEND_API_KEY || !segment) return "skipped";
  try {
    await call("/contacts", { email, unsubscribed: false, segments: [{ id: segment }] });
    return "added";
  } catch (e) {
    if (e instanceof ResendError && (e.status === 401 || e.status === 403)) return "no_permission";
    if (e instanceof ResendError && e.status === 409) return "added"; // already a contact
    throw e;
  }
}

export async function emailOwner(subject: string, text: string, replyTo?: string) {
  const to = process.env.OWNER_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) return false;
  const from = process.env.RESEND_FROM || "E7 This Week <onboarding@resend.dev>";
  await call("/emails", { from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) });
  return true;
}
