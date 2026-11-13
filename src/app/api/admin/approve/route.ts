import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, readBody, str, unauthorized } from "@/lib/http";

/**
 * POST { id, action: "approve" | "reject", rewards?, expires_at?, note? }
 * Approving inserts (or updates) the code in `codes` as active.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const body = await readBody(req);
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) {
    return json({ error: "need { id: number, action: 'approve' | 'reject' }" }, 400);
  }
  const [sub] = await sql`SELECT * FROM submissions WHERE id = ${id}`;
  if (!sub) return json({ error: "submission not found" }, 404);
  const note = str(body.note, 500);
  if (action === "reject") {
    await sql`UPDATE submissions SET status = 'rejected', review_note = ${note}, reviewed_at = now() WHERE id = ${id}`;
    return json({ ok: true, status: "rejected" });
  }
  const rewards = str(body.rewards, 300) ?? sub.rewards;
  const expires = str(body.expires_at, 40);
  if (expires && Number.isNaN(Date.parse(expires))) return json({ error: "expires_at must be an ISO date" }, 400);
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO codes (code, rewards, status, found_at, expires_at, source_name, source_url, note)
      VALUES (${sub.code}, ${rewards}, 'active', ${sub.created_at}, ${expires}, 'Player submission', ${sub.source_url}, ${note})
      ON CONFLICT (code) DO UPDATE SET rewards = COALESCE(EXCLUDED.rewards, codes.rewards),
        status = 'active', expires_at = COALESCE(EXCLUDED.expires_at, codes.expires_at), updated_at = now()`;
    await tx`UPDATE submissions SET status = 'approved', review_note = ${note}, reviewed_at = now() WHERE id = ${id}`;
  });
  revalidatePath("/", "layout");
  return json({ ok: true, status: "approved", code: sub.code });
}
