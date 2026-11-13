import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, readBody, str, unauthorized } from "@/lib/http";

/**
 * Admin-only removal of a subscriber (by email, e.g. a deletion request) and/or a submission (by id).
 * Returns how many rows were deleted from each table.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const body = await readBody(req);
  const email = str(body.email, 320)?.toLowerCase() ?? null;
  const subId = Number(body.submission_id);
  const out: Record<string, number> = {};
  if (email) {
    out.signups = (await sql`DELETE FROM signups WHERE lower(email) = ${email}`).count;
    out.rerun_alerts = (await sql`DELETE FROM rerun_alerts WHERE lower(email) = ${email}`).count;
  }
  if (Number.isInteger(subId) && subId > 0) {
    out.submissions = (await sql`DELETE FROM submissions WHERE id = ${subId}`).count;
  }
  if (!Object.keys(out).length) return json({ error: "pass email and/or submission_id" }, 400);
  return json({ ok: true, deleted: out });
}
