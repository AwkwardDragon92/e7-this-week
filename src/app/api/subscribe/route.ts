import { getSql, logError } from "@/lib/db";
import { checkEmail } from "@/lib/email";
import { json, readBody, str } from "@/lib/http";
import { addToAudience } from "@/lib/resend";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (str(body.website)) return json({ ok: true }); // honeypot: pretend success
  const check = checkEmail(body.email);
  if (!check.ok) return json({ ok: false, error: check.error }, 400);
  const sql = getSql();
  let resendStatus = "skipped";
  try {
    resendStatus = await addToAudience(check.email);
  } catch (e) {
    resendStatus = "error";
    await logError("api.subscribe.resend", e, "/api/subscribe");
  }
  if (!sql) {
    if (resendStatus === "added") return json({ ok: true });
    return json({ ok: false, error: "Signups open soon. Check back in a bit!" }, 503);
  }
  try {
    await sql`
      INSERT INTO signups (email, source, resend_status) VALUES (${check.email}, ${str(body.source, 60)}, ${resendStatus})
      ON CONFLICT (email) DO UPDATE SET unsubscribed = false, resend_status = EXCLUDED.resend_status`;
    return json({ ok: true });
  } catch (e) {
    await logError("api.subscribe", e, "/api/subscribe");
    return json({ ok: false, error: "Something went wrong. Try again?" }, 500);
  }
}
