import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, unauthorized } from "@/lib/http";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const rows = await sql`SELECT id, code, rewards, source_url, created_at,
      EXISTS (SELECT 1 FROM codes c WHERE lower(c.code) = lower(s.code)) AS already_listed
    FROM submissions s WHERE status = 'pending' ORDER BY created_at ASC LIMIT 200`;
  return json({ pending: rows });
}
