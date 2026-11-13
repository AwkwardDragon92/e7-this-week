import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, unauthorized } from "@/lib/http";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const rows = await sql`SELECT page, query, count(*)::int AS times, max(created_at) AS last_seen
    FROM zero_result_searches WHERE created_at > now() - interval '30 days'
    GROUP BY page, query ORDER BY times DESC, last_seen DESC LIMIT 200`;
  return json({ zeroResultSearches: rows });
}
