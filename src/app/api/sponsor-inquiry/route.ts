import { getSql, logError } from "@/lib/db";
import { checkEmail } from "@/lib/email";
import { json, readBody, str } from "@/lib/http";
import { emailOwner } from "@/lib/resend";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (str(body.website)) return json({ ok: true });
  const check = checkEmail(body.email);
  if (!check.ok) return json({ ok: false, error: check.error }, 400);
  const name = str(body.name, 120);
  const company = str(body.company, 160);
  const message = str(body.message, 4000);
  const sql = getSql();
  let id: number | null = null;
  if (sql) {
    try {
      const [row] = await sql`INSERT INTO sponsor_inquiries (name, email, company, message) VALUES (${name}, ${check.email}, ${company}, ${message}) RETURNING id`;
      id = row.id;
    } catch (e) {
      await logError("api.sponsor-inquiry", e, "/api/sponsor-inquiry");
    }
  }
  let emailed = false;
  try {
    emailed = await emailOwner(
      `Sponsor inquiry: ${company || name || check.email}`,
      `New sponsor inquiry on E7 This Week\n\nName: ${name ?? ""}\nEmail: ${check.email}\nCompany: ${company ?? ""}\n\n${message ?? ""}`,
      check.email,
    );
    if (emailed && sql && id) await sql`UPDATE sponsor_inquiries SET emailed = true WHERE id = ${id}`;
  } catch (e) {
    await logError("api.sponsor-inquiry.email", e, "/api/sponsor-inquiry");
  }
  if (!id && !emailed) return json({ ok: false, error: "Couldn't save that right now. Try again later." }, 503);
  return json({ ok: true });
}
