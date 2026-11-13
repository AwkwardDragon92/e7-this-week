/** Minimal Resend REST calls. Every function is a no-op when env vars are missing. */
const API = "https://api.resend.com";

async function call(path: string, body: unknown) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true as const };
  const res = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { skipped: false as const, data: await res.json() };
}

export async function addToAudience(email: string) {
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!process.env.RESEND_API_KEY || !audience) return "skipped";
  await call(`/audiences/${audience}/contacts`, { email, unsubscribed: false });
  return "added";
}

export async function emailOwner(subject: string, text: string, replyTo?: string) {
  const to = process.env.OWNER_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) return false;
  const from = process.env.RESEND_FROM || "E7 This Week <onboarding@resend.dev>";
  await call("/emails", { from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) });
  return true;
}
